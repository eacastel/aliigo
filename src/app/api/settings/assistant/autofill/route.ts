import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FieldStatus = "suggested" | "needs_review" | "missing";

function normalizeHostname(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  let host = raw;
  try {
    const withProto = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    host = new URL(withProto).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.split(":")[0].trim();
  if (host.startsWith("www.")) host = host.slice(4);
  if (!host || !host.includes(".")) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  return host;
}

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pickFirst(html: string, regex: RegExp): string {
  const m = html.match(regex);
  return (m?.[1] ?? "").trim();
}

function parseAutofill(url: string, html: string) {
  const title = pickFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    pickFirst(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    pickFirst(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const h1 = pickFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/\s+/g, " ").trim();

  const plain = stripTags(html);
  const firstParagraphs = plain.split(". ").slice(0, 5).join(". ").trim();

  const emailMatch = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const supportEmail = emailMatch?.[0] ?? "";

  const hrefRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links: Array<{ href: string; text: string }> = [];
  let lm: RegExpExecArray | null;
  while ((lm = hrefRegex.exec(html)) && links.length < 80) {
    links.push({ href: lm[1], text: stripTags(lm[2]).toLowerCase() });
  }

  const absolute = (href: string) => {
    try {
      return new URL(href, url).toString();
    } catch {
      return "";
    }
  };

  const ctaCandidates = links
    .filter((l) => /(book|reserve|contact|signup|register|join|demo|pricing|planes|precio|contacto|reserv)/i.test(l.text))
    .map((l) => absolute(l.href))
    .filter(Boolean);

  const policyCandidates = links
    .filter((l) => /(privacy|terms|cookies|policy|refund|gdpr|privacidad|terminos|condiciones)/i.test(l.text + " " + l.href))
    .map((l) => absolute(l.href))
    .filter(Boolean);

  const facts = plain
    .split(/[\n.]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 20 && x.length < 200)
    .slice(0, 8)
    .map((x) => `- ${x}`)
    .join("\n");

  const businessSummary = [title, description].filter(Boolean).join(" — ").trim();
  const businessDetails = [h1, firstParagraphs].filter(Boolean).join("\n\n").trim();

  const draftForm = {
    businessSummary,
    businessDetails,
    keyFacts: facts,
    policies: policyCandidates.slice(0, 5).join("\n"),
    links: links
      .map((l) => absolute(l.href))
      .filter(Boolean)
      .slice(0, 8)
      .join("\n"),
    ctaUrls: ctaCandidates.slice(0, 5).join("\n"),
    supportEmail,
  };

  const fieldStatuses: Record<string, FieldStatus> = {};
  for (const [k, v] of Object.entries(draftForm)) {
    fieldStatuses[k] = v && v.trim().length > 0 ? "suggested" : "missing";
  }

  return { draftForm, fieldStatuses };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { url?: string };
    const sourceUrl = (body.url ?? "").trim();
    if (!sourceUrl) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const normalizedHost = normalizeHostname(sourceUrl);
    if (!normalizedHost) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const authed = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await authed.auth.getUser();
    const userId = userRes?.user?.id;
    if (userErr || !userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: profile, error: pErr } = await admin
      .from("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single<{ business_id: string | null }>();
    if (pErr || !profile?.business_id) {
      return NextResponse.json({ error: "Business not linked to profile" }, { status: 400 });
    }

    const { data: business, error: bErr } = await admin
      .from("businesses")
      .select("allowed_domains")
      .eq("id", profile.business_id)
      .single<{ allowed_domains: string[] | null }>();
    if (bErr) {
      return NextResponse.json({ error: bErr.message }, { status: 400 });
    }

    const allowed = new Set((business.allowed_domains ?? []).map((d) => d.toLowerCase()));
    if (!allowed.has(normalizedHost) && !allowed.has(`www.${normalizedHost}`)) {
      return NextResponse.json({ error: "URL is not in allowed domains" }, { status: 403 });
    }

    const response = await fetch(sourceUrl, {
      method: "GET",
      headers: { "User-Agent": "Aliigo Autofill/1.0" },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: `Could not fetch URL (${response.status})` }, { status: 400 });
    }
    const html = await response.text();
    const { draftForm, fieldStatuses } = parseAutofill(sourceUrl, html);

    return NextResponse.json({
      ok: true,
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      draftForm,
      fieldStatuses,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

