import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FieldStatus = "suggested" | "needs_review" | "missing";
type CrawledLink = { href: string; text: string };
type RecConfidence = "low" | "medium" | "high";
type AdvancedRecField = "scope" | "styleRules" | "additionalInstructions" | "qualificationPrompt";
type AdvancedRecommendation = {
  value: string;
  confidence: RecConfidence;
  rationale: string;
  sources: string[];
};

const MAX_CRAWL_PAGES = 20;
const MAX_CRAWL_DEPTH = 2;
const MAX_CRAWL_MS = 20_000;
const FETCH_TIMEOUT_MS = 4_000;
const EXCLUDED_PATH_PREFIXES = [
  "/wp-admin",
  "/wp-login",
  "/admin",
  "/dashboard",
  "/account",
  "/checkout",
  "/cart",
  "/login",
  "/signin",
  "/auth",
  "/api",
];
const EXCLUDED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".zip",
  ".xml",
  ".json",
];

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

function normalizeUrl(raw: string, base: string): string {
  try {
    const u = new URL(raw, base);
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

function isSameDomain(url: string, normalizedHost: string): boolean {
  try {
    const u = new URL(url);
    const h = normalizeHostname(u.hostname);
    return h === normalizedHost;
  } catch {
    return false;
  }
}

function isCrawlAllowed(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (EXCLUDED_PATH_PREFIXES.some((p) => path.startsWith(p))) return false;
    if (EXCLUDED_EXTENSIONS.some((ext) => path.endsWith(ext))) return false;
    if (u.searchParams.has("preview") || u.searchParams.has("token")) return false;
    return true;
  } catch {
    return false;
  }
}

function extractLinks(pageUrl: string, html: string): CrawledLink[] {
  const hrefRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links: CrawledLink[] = [];
  let lm: RegExpExecArray | null;
  while ((lm = hrefRegex.exec(html)) && links.length < 120) {
    const href = normalizeUrl(lm[1], pageUrl);
    if (!href) continue;
    links.push({ href, text: stripTags(lm[2]).toLowerCase() });
  }
  return links;
}

function parsePage(url: string, html: string) {
  const title = pickFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    pickFirst(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    pickFirst(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const h1 = pickFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/\s+/g, " ").trim();
  const plain = stripTags(html);
  const emailMatch = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const links = extractLinks(url, html);
  return {
    title,
    description,
    h1,
    plain,
    emails: emailMatch ?? [],
    links,
  };
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "Aliigo Autofill/1.0" },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function crawlSite(startUrl: string, normalizedHost: string) {
  const startedAt = Date.now();
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const seen = new Set<string>();

  const titles: string[] = [];
  const descriptions: string[] = [];
  const h1s: string[] = [];
  const snippets: string[] = [];
  const emails = new Set<string>();
  const allLinks: CrawledLink[] = [];

  while (queue.length > 0 && seen.size < MAX_CRAWL_PAGES) {
    if (Date.now() - startedAt > MAX_CRAWL_MS) break;
    const current = queue.shift();
    if (!current) break;
    if (seen.has(current.url)) continue;
    if (!isSameDomain(current.url, normalizedHost) || !isCrawlAllowed(current.url)) continue;

    seen.add(current.url);
    const html = await fetchWithTimeout(current.url);
    if (!html) continue;
    const parsed = parsePage(current.url, html);
    if (parsed.title) titles.push(parsed.title);
    if (parsed.description) descriptions.push(parsed.description);
    if (parsed.h1) h1s.push(parsed.h1);
    for (const e of parsed.emails) emails.add(e);
    allLinks.push(...parsed.links);

    const split = parsed.plain
      .split(". ")
      .map((x) => x.trim())
      .filter((x) => x.length > 30 && x.length < 220)
      .slice(0, 4);
    snippets.push(...split);

    if (current.depth >= MAX_CRAWL_DEPTH) continue;
    for (const link of parsed.links) {
      if (!isSameDomain(link.href, normalizedHost) || !isCrawlAllowed(link.href)) continue;
      if (seen.has(link.href)) continue;
      queue.push({ url: link.href, depth: current.depth + 1 });
      if (queue.length > MAX_CRAWL_PAGES * 4) break;
    }
  }

  return { titles, descriptions, h1s, snippets, emails: Array.from(emails), links: allLinks, pagesCrawled: seen.size };
}

function parseAutofill(crawled: Awaited<ReturnType<typeof crawlSite>>) {
  const ctaCandidates = crawled.links
    .filter((l) => /(book|reserve|contact|signup|register|join|demo|pricing|planes|precio|contacto|reserv)/i.test(l.text))
    .map((l) => l.href)
    .filter(Boolean);

  const policyCandidates = crawled.links
    .filter((l) => /(privacy|terms|cookies|policy|refund|gdpr|privacidad|terminos|condiciones)/i.test(l.text + " " + l.href))
    .map((l) => l.href)
    .filter(Boolean);

  const facts = crawled.snippets
    .map((x) => x.trim())
    .filter((x) => x.length > 20 && x.length < 220)
    .slice(0, 8)
    .map((x) => `- ${x}`)
    .join("\n");

  const businessSummary = [crawled.titles[0], crawled.descriptions[0]].filter(Boolean).join(" — ").trim();
  const businessDetails = [crawled.h1s[0], crawled.snippets.slice(0, 5).join(". ")].filter(Boolean).join("\n\n").trim();
  const supportEmail = crawled.emails[0] ?? "";

  const draftForm = {
    businessSummary,
    businessDetails,
    keyFacts: facts,
    policies: policyCandidates.slice(0, 5).join("\n"),
    links: crawled.links.map((l) => l.href).filter(Boolean).slice(0, 12).join("\n"),
    ctaUrls: ctaCandidates.slice(0, 5).join("\n"),
    supportEmail,
  };

  const fieldStatuses: Record<string, FieldStatus> = {};
  for (const [k, v] of Object.entries(draftForm)) {
    fieldStatuses[k] = v && v.trim().length > 0 ? "suggested" : "missing";
  }

  return { draftForm, fieldStatuses, pagesCrawled: crawled.pagesCrawled };
}

function uniqUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function buildAdvancedRecommendations(crawled: Awaited<ReturnType<typeof crawlSite>>) {
  const sources = uniqUrls(crawled.links.map((l) => l.href)).slice(0, 5);
  const policyLinks = crawled.links
    .filter((l) => /(privacy|terms|cookies|policy|refund|gdpr|privacidad|terminos|condiciones)/i.test(l.text + " " + l.href))
    .map((l) => l.href);
  const ctaLinks = crawled.links
    .filter((l) => /(book|reserve|contact|signup|register|join|demo|pricing|planes|precio|contacto|reserv)/i.test(l.text + " " + l.href))
    .map((l) => l.href);
  const summary = [crawled.titles[0], crawled.h1s[0], crawled.descriptions[0]].filter(Boolean).join(" — ").trim();
  const hasSignal = crawled.pagesCrawled >= 3 && crawled.snippets.length >= 8;
  const confidence: RecConfidence = hasSignal ? "high" : crawled.pagesCrawled >= 2 ? "medium" : "low";

  const recs: Partial<Record<AdvancedRecField, AdvancedRecommendation>> = {};

  const scopeValue = [
    "Answer only with information that appears in approved business content.",
    "If information is missing, say it clearly and ask one short clarifying question.",
    "Do not invent policies, pricing, availability, or legal details.",
    summary ? `Business context: ${summary}.` : "",
    policyLinks.length ? `Policy references available: ${uniqUrls(policyLinks).slice(0, 3).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  recs.scope = {
    value: scopeValue,
    confidence,
    rationale: `Built from ${crawled.pagesCrawled} crawled pages and detected policy links.`,
    sources,
  };

  const styleValue = [
    "Use short paragraphs and bullet points when listing steps.",
    "Be clear and practical. Avoid hype language.",
    "When sharing a link, explain what the user will find there.",
    "End with one concise next-step question.",
  ].join("\n");
  recs.styleRules = {
    value: styleValue,
    confidence: crawled.pagesCrawled >= 2 ? "medium" : "low",
    rationale: "Default conversion-safe style template based on business support flow.",
    sources,
  };

  const additionalValue = [
    "If user asks for rules/policies, prefer official policy pages first.",
    "If user asks for signup/joining, share the best matching CTA link.",
    "If user asks for unavailable data, offer to collect lead details for follow-up.",
  ].join("\n");
  recs.additionalInstructions = {
    value: additionalValue,
    confidence: "medium",
    rationale: "Generated from detected CTA and policy intents.",
    sources: uniqUrls([...ctaLinks, ...policyLinks]).slice(0, 5),
  };

  const qualificationValue = [
    "Collect lead details only when user asks for follow-up, demo, or cannot be answered with available content.",
    "Required fields: name and email. Phone optional unless user offers it.",
    ctaLinks.length
      ? `When intent is explicit, guide user to one CTA link: ${uniqUrls(ctaLinks).slice(0, 3).join(", ")}`
      : "When intent is explicit, guide user to the primary contact/signup page.",
  ].join("\n");
  recs.qualificationPrompt = {
    value: qualificationValue,
    confidence: ctaLinks.length > 0 ? "high" : "medium",
    rationale: `Detected ${uniqUrls(ctaLinks).length} CTA-like links from crawled pages.`,
    sources: uniqUrls(ctaLinks).slice(0, 5),
  };

  return recs as Record<AdvancedRecField, AdvancedRecommendation>;
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

    const body = (await req.json().catch(() => ({}))) as {
      url?: string;
      mode?: "merge" | "replace";
    };
    const sourceUrl = (body.url ?? "").trim();
    const mode = body.mode === "replace" ? "replace" : "merge";
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

    const crawled = await crawlSite(sourceUrl, normalizedHost);
    const { draftForm, fieldStatuses, pagesCrawled } = parseAutofill(crawled);
    const advancedRecommendations = buildAdvancedRecommendations(crawled);

    return NextResponse.json({
      ok: true,
      sourceUrl,
      mode,
      fetchedAt: new Date().toISOString(),
      draftForm,
      fieldStatuses,
      advancedRecommendations,
      pagesCrawled,
      limits: {
        maxPages: MAX_CRAWL_PAGES,
        maxDepth: MAX_CRAWL_DEPTH,
        maxMs: MAX_CRAWL_MS,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
