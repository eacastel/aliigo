import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { effectivePlanForEntitlements } from "@/lib/effectivePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CRAWL_PAGES = 20;
const MAX_CRAWL_DEPTH = 2;
const MAX_CRAWL_MS = 20_000;
const FETCH_TIMEOUT_MS = 4_000;
const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 120;

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

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function normalizeLocale(input: unknown): "en" | "es" {
  return typeof input === "string" && input.toLowerCase().startsWith("es") ? "es" : "en";
}

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

function normalizeUrl(raw: string, base: string): string {
  try {
    const u = new URL(raw, base);
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
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

function checksum(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(31, h) + input.charCodeAt(i) | 0;
  }
  return String(h >>> 0);
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const clean = text.trim();
  if (!clean) return chunks;
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + CHUNK_SIZE);
    const slice = clean.slice(i, end).trim();
    if (slice.length > 40) chunks.push(slice);
    if (end >= clean.length) break;
    i = Math.max(i + 1, end - CHUNK_OVERLAP);
  }
  return chunks;
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "Aliigo KnowledgeCrawler/1.0" },
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

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!openai || texts.length === 0) {
    return texts.map(() => []);
  }
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  const out = await openai.embeddings.create({ model, input: texts });
  return out.data.map((x) => x.embedding);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    if (!token) return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      url?: string;
      locale?: string;
      mode?: "website" | "single_page";
    };
    const sourceUrl = (body.url ?? "").trim();
    if (!sourceUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });
    const normalizedHost = normalizeHostname(sourceUrl);
    if (!normalizedHost) return NextResponse.json({ error: "Invalid url" }, { status: 400 });

    const locale = normalizeLocale(body.locale);
    const crawlMode = body.mode === "single_page" ? "single_page" : "website";
    const maxPages = crawlMode === "single_page" ? 1 : MAX_CRAWL_PAGES;
    const maxDepth = crawlMode === "single_page" ? 0 : MAX_CRAWL_DEPTH;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const authed = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await authed.auth.getUser();
    const userId = userRes?.user?.id;
    if (userErr || !userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: profile, error: pErr } = await admin
      .from("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single<{ business_id: string | null }>();
    if (pErr || !profile?.business_id) {
      return NextResponse.json({ error: "Business not linked to profile" }, { status: 400 });
    }
    const businessId = profile.business_id;

    const { data: business, error: bErr } = await admin
      .from("businesses")
      .select("allowed_domains,billing_plan,billing_status,trial_end")
      .eq("id", businessId)
      .single<{
        allowed_domains: string[] | null;
        billing_plan: string | null;
        billing_status: "incomplete" | "trialing" | "active" | "canceled" | "past_due" | null;
        trial_end: string | null;
      }>();
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });

    const effectivePlan = effectivePlanForEntitlements({
      billingPlan: business.billing_plan,
      billingStatus: business.billing_status,
      trialEnd: business.trial_end,
    });
    if (effectivePlan === "basic" || effectivePlan === "starter") {
      return NextResponse.json(
        { error: "Website indexing is available on Growth+ plans." },
        { status: 403 },
      );
    }

    const allowed = new Set((business.allowed_domains ?? []).map((d) => d.toLowerCase()));
    if (!allowed.has(normalizedHost) && !allowed.has(`www.${normalizedHost}`)) {
      return NextResponse.json({ error: "URL is not in allowed domains" }, { status: 403 });
    }

    // Ownership/activity validation: require recent widget heartbeat for this domain.
    const domainCandidates = new Set([normalizedHost, `www.${normalizedHost}`]);
    const activeSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const heartbeat = await admin
      .from("embed_sessions")
      .select("host,expires_at")
      .eq("business_id", businessId)
      .eq("is_preview", false)
      .gte("expires_at", activeSince)
      .order("expires_at", { ascending: false })
      .limit(30);
    if (heartbeat.error) {
      return NextResponse.json({ error: heartbeat.error.message }, { status: 500 });
    }
    const activeDomain = (heartbeat.data ?? []).some((row) => {
      const h = normalizeHostname(String(row.host ?? ""));
      return !!h && (domainCandidates.has(h) || domainCandidates.has(`www.${h}`));
    });
    if (!activeDomain) {
      return NextResponse.json(
        {
          error:
            "Domain not validated yet. Install the widget on this domain and load the page once, then retry indexing.",
        },
        { status: 403 }
      );
    }

    const runInsert = await admin
      .from("knowledge_ingestion_runs")
      .insert({
        business_id: businessId,
        trigger_type: "crawl",
        source_url: sourceUrl,
        requested_by: userId,
        status: "running",
      })
      .select("id")
      .single<{ id: string }>();
    if (runInsert.error || !runInsert.data) {
      return NextResponse.json({ error: runInsert.error?.message ?? "Could not create run" }, { status: 500 });
    }
    const runId = runInsert.data.id;

    const startedAt = Date.now();
    const queue: Array<{ url: string; depth: number }> = [{ url: sourceUrl, depth: 0 }];
    const seen = new Set<string>();
    let docsUpserted = 0;
    let chunksUpserted = 0;
    const errors: string[] = [];

    while (queue.length > 0 && seen.size < maxPages) {
      if (Date.now() - startedAt > MAX_CRAWL_MS) break;
      const current = queue.shift();
      if (!current) break;
      if (seen.has(current.url)) continue;
      if (!isSameDomain(current.url, normalizedHost) || !isCrawlAllowed(current.url)) continue;
      seen.add(current.url);

      const html = await fetchWithTimeout(current.url);
      if (!html) {
        errors.push(`Fetch failed: ${current.url}`);
        continue;
      }

      const title = pickFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
      const text = stripTags(html);
      const docChecksum = checksum(`${title}\n${text}`);

      const docPayload = {
        business_id: businessId,
        source_type: "website" as const,
        source_url: current.url,
        source_label: title || current.url,
        locale,
        checksum: docChecksum,
        status: "active" as const,
        metadata: { runId, depth: current.depth },
        updated_by: userId,
      };

      const existing = await admin
        .from("knowledge_documents")
        .select("id")
        .eq("business_id", businessId)
        .eq("source_type", "website")
        .eq("source_url", current.url)
        .eq("locale", locale)
        .maybeSingle<{ id: string }>();

      if (existing.error) {
        errors.push(`Doc lookup failed: ${current.url} (${existing.error.message})`);
        continue;
      }

      let documentId: string | null = null;
      if (existing.data?.id) {
        const updated = await admin
          .from("knowledge_documents")
          .update(docPayload)
          .eq("id", existing.data.id)
          .select("id")
          .single<{ id: string }>();
        if (updated.error || !updated.data?.id) {
          errors.push(`Doc update failed: ${current.url} (${updated.error?.message ?? "unknown"})`);
          continue;
        }
        documentId = updated.data.id;
      } else {
        const inserted = await admin
          .from("knowledge_documents")
          .insert({
            ...docPayload,
            created_by: userId,
          })
          .select("id")
          .single<{ id: string }>();
        if (inserted.error || !inserted.data?.id) {
          errors.push(`Doc insert failed: ${current.url} (${inserted.error?.message ?? "unknown"})`);
          continue;
        }
        documentId = inserted.data.id;
      }

      if (!documentId) {
        errors.push(`Doc upsert failed: ${current.url} (unknown)`);
        continue;
      }
      docsUpserted += 1;

      const chunks = chunkText(text);
      if (chunks.length > 0) {
        const vectors = await embedBatch(chunks);
        const rows = chunks.map((content, idx) => ({
          document_id: documentId,
          business_id: businessId,
          chunk_index: idx,
          locale,
          content,
          token_count: Math.ceil(content.length / 4),
          embedding: vectors[idx] && vectors[idx].length > 0 ? vectors[idx] : null,
          metadata: { source_url: current.url, source_label: title || current.url },
        }));

        const delOld = await admin.from("knowledge_chunks").delete().eq("document_id", documentId);
        if (delOld.error) {
          errors.push(`Delete old chunks failed: ${current.url}`);
        }

        const insChunks = await admin.from("knowledge_chunks").insert(rows);
        if (insChunks.error) {
          errors.push(`Insert chunks failed: ${current.url}`);
        } else {
          chunksUpserted += rows.length;
        }
      }

      if (current.depth >= maxDepth) continue;
      const hrefRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m: RegExpExecArray | null;
      while ((m = hrefRegex.exec(html)) && queue.length < maxPages * 4) {
        const next = normalizeUrl(m[1], current.url);
        if (!next) continue;
        if (!isSameDomain(next, normalizedHost) || !isCrawlAllowed(next)) continue;
        if (!seen.has(next)) queue.push({ url: next, depth: current.depth + 1 });
      }
    }

    await admin
      .from("knowledge_ingestion_runs")
      .update({
        status: "completed",
        pages_scanned: seen.size,
        documents_upserted: docsUpserted,
        chunks_upserted: chunksUpserted,
        errors,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return NextResponse.json({
      ok: true,
      runId,
      pagesScanned: seen.size,
      documentsUpserted: docsUpserted,
      chunksUpserted: chunksUpserted,
      errors,
      limits: {
        maxPages,
        maxDepth,
        maxMs: MAX_CRAWL_MS,
      },
      mode: crawlMode,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
