import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { originHost, hostAllowed } from "@/lib/embedGate";
import {
  countUserMessagesForBusiness,
  resolveUsageWindow,
  type BillingPlan,
  type BillingStatus,
} from "@/lib/billingUsage";
import { buildLeadNotification, normalizeLocale as normalizeLeadLocale } from "@/emails/lead/notification";
import { getCurrencyFromHeaders, type AliigoCurrency } from "@/lib/currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- single admin client (server-only) ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const ALLOWED_CHANNELS = ["web", "whatsapp", "sms", "email", "telegram"] as const;
type Channel = (typeof ALLOWED_CHANNELS)[number];

function isChannel(v: unknown): v is Channel {
  return typeof v === "string" && (ALLOWED_CHANNELS as readonly string[]).includes(v);
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type ChatRole = "user" | "assistant" | "system" | "tool";
type MessagesRow = { role: ChatRole; content: string; created_at: string };

class RateLimitError extends Error {
  status = 429 as const;
  constructor(m = "Rate limited") {
    super(m);
  }
}

function sanitizeHost(v: string) {
  return (v || "").trim().toLowerCase().replace(/:\d+$/, "");
}

function corsHeadersFor(req: NextRequest): HeadersInit {
  const origin = req.headers.get("origin") || "";

  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (!origin) return base;

  return {
    ...base,
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

function clientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "0.0.0.0";
}

function clampText(v: string, max = 160) {
  const s = (v || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}


type ToolExtract = { name: string; arguments: string };

function getFunctionToolCall(
  tc: OpenAI.Chat.Completions.ChatCompletionMessageToolCall | null | undefined
): ToolExtract | null {
  if (!tc) return null;
  if (tc.type !== "function") return null;

  // After tc.type narrowing, tc.function exists on this variant.
  const fn = tc.function;

  if (!fn || typeof fn.name !== "string") return null;

  return {
    name: fn.name,
    arguments: typeof fn.arguments === "string" ? fn.arguments : "{}",
  };
}

function safeJsonParseObject(raw: string): Record<string, unknown> {
  try {
    const v: unknown = JSON.parse(raw);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}



async function rateLimit(businessId: string, ip: string) {
  const WINDOW_MS = process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000;
  const LIMIT = process.env.NODE_ENV === "production" ? 20 : 1000;

  const ins = await supabase.from("rate_events").insert({
    ip,
    bucket: `chat:${businessId}`,
    business_id: businessId,
  });
  if (ins.error) throw ins.error;

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const countRes = await supabase
    .from("rate_events")
    .select("*", { head: true, count: "exact" })
    .gte("created_at", since)
    .eq("ip", ip)
    .eq("business_id", businessId)
    .eq("bucket", `chat:${businessId}`);
  if (countRes.error) throw countRes.error;
  if ((countRes.count ?? 0) > LIMIT) throw new RateLimitError();
}

function aliigoHost() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com";
  try {
    return new URL(base).hostname.toLowerCase();
  } catch {
    return "aliigo.com";
  }
}

async function validateEmbedAccess(token: string, host: string) {
  if (!token) return { ok: false as const, reason: "Missing token" };
  if (!host) return { ok: false as const, reason: "Missing host" };

  // 1) short-lived session tokens (enterprise path)
  const sess = await supabase
    .from("embed_sessions")
    .select("business_id, host, is_preview, expires_at")
    .eq("token", token)
    .maybeSingle<{
      business_id: string;
      host: string;
      is_preview: boolean;
      expires_at: string;
    }>();

  if (sess.error) return { ok: false as const, reason: "Invalid token" };

  if (sess.data?.business_id) {
    const exp = Date.parse(sess.data.expires_at);
    if (!Number.isFinite(exp) || exp <= Date.now()) {
      return { ok: false as const, reason: "Session expired" };
    }

    const tokenHost = (sess.data.host || "").toLowerCase().trim().replace(/:\d+$/, "");
    if (tokenHost !== host) {
      return { ok: false as const, reason: "Host mismatch" };
    }

    // Preview sessions must only be usable from aliigo.com
    if (sess.data.is_preview) {
      if (host !== aliigoHost()) return { ok: false as const, reason: "Preview token forbidden" };
    }

    return {
      ok: true as const,
      businessId: sess.data.business_id,
      isPreview: !!sess.data.is_preview,
    };
  }

  // 2) legacy fallback (keep temporarily; remove later)
  const tok = await supabase.from("embed_tokens").select("business_id").eq("token", token).single();
  if (tok.error || !tok.data) return { ok: false as const, reason: "Invalid token" };

  const biz = await supabase.from("businesses").select("id,allowed_domains").eq("id", tok.data.business_id).single();
  if (biz.error || !biz.data) return { ok: false as const, reason: "Business missing" };

  if (!hostAllowed(host, biz.data.allowed_domains)) {
    return { ok: false as const, reason: "Domain not allowed" };
  }

  return { ok: true as const, businessId: biz.data.id, isPreview: false as const };
}

function isBillingActive(status: BillingStatus | null | undefined) {
  return status === "trialing" || status === "active";
}

function isTrialExpired(trialEnd: string | null) {
  if (!trialEnd) return false;
  const endMs = Date.parse(trialEnd);
  return Number.isFinite(endMs) && endMs <= Date.now();
}

// -------------------- Actions schema --------------------

type ActionCollectLead = {
  type: "collect_lead";
  fields: Array<"name" | "email" | "phone">; // widget shows a small form
  reason?: string; // optional internal hint
};

type ActionCta = {
  type: "cta";
  label: string;
  url: string;
};

type Action = ActionCollectLead | ActionCta;

function isAction(v: unknown): v is Action {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;

  if (o.type === "collect_lead") {
    const fields = o.fields;
    if (!Array.isArray(fields) || fields.length < 1) return false;
    return fields.every((f) => f === "name" || f === "email" || f === "phone");
  }

  if (o.type === "cta") {
    return typeof o.label === "string" && typeof o.url === "string";
  }

  return false;
}

type LeadPayload = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  consent?: boolean | null;
};

function normalizeEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (!s) return null;
  // minimal check; don’t over-validate
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s.slice(0, 254);
}

function normalizePhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, 40);
}

function normalizeName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, 120);
}

function normalizeConversationId(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuid.test(s) ? s : null;
}

function normalizeLead(lead: LeadPayload): LeadPayload {
  return {
    name: normalizeName(lead.name),
    email: normalizeEmail(lead.email),
    phone: normalizePhone(lead.phone),
    consent: lead.consent === true,
  };
}

function hasAnyLead(lead: LeadPayload | null | undefined) {
  return !!(lead?.email || lead?.phone || lead?.name);
}

async function saveLeadClean(opts: {
  businessId: string;
  conversationId: string;
  channel: Channel;
  host: string;
  externalRef: string | null;
  ip: string;
  lead: LeadPayload;
}): Promise<LeadPayload | null> {
  const lead = normalizeLead(opts.lead);

  if (!hasAnyLead(lead)) return null;

  const basePayload = {
    business_id: opts.businessId,
    conversation_id: opts.conversationId,
    channel: opts.channel,
    source_host: opts.host,
    external_ref: opts.externalRef,
    ip: opts.ip,
    name: lead.name ?? null,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
  };

  const ins = await supabase.from("leads").insert({
    ...basePayload,
    consent: lead.consent === true,
  });

  if (ins.error) {
    const msg = (ins.error.message || "").toLowerCase();
    if (msg.includes("consent") && msg.includes("does not exist")) {
      const retry = await supabase.from("leads").insert(basePayload);
      if (retry.error) throw retry.error;
    } else {
      throw ins.error;
    }
  }
  return lead;
}

async function trySaveLead(opts: {
  businessId: string;
  conversationId: string;
  channel: Channel;
  host: string;
  externalRef: string | null;
  ip: string;
  lead: LeadPayload;
}): Promise<LeadPayload | null> {
  try {
    return await saveLeadClean(opts);
  } catch (e) {
    console.error("Lead save failed:", e);
    return null;
  }
}

async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
}

async function logEmailAudit(entry: {
  email: string;
  event: string;
  locale?: string | null;
  source?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  try {
    await supabase.from("email_audit").insert({
      email: entry.email,
      event: entry.event,
      locale: entry.locale ?? null,
      source: entry.source ?? null,
      payload: entry.payload ?? null,
    });
  } catch {
    // fail-open
  }
}

async function getBusinessContactEmail(businessId: string): Promise<string | null> {
  const { data } = await supabase
    .from("business_profiles")
    .select("email")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ email: string | null }>();

  return data?.email || process.env.RESEND_TO_EMAIL || null;
}

async function buildConversationSummary(conversationId: string, locale: "en" | "es") {
  const { data } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(8);

  const rows = Array.isArray(data) ? (data as MessagesRow[]) : [];
  return rows
    .slice()
    .reverse()
    .map((m) => {
      const label =
        m.role === "assistant"
          ? locale === "es"
            ? "Asistente"
            : "Assistant"
          : m.role === "system"
            ? locale === "es"
              ? "Sistema"
              : "System"
            : locale === "es"
              ? "Visitante"
              : "Visitor";
      return `${label}: ${clampText(m.content || "")}`;
    });
}

// -------------------- HTTP --------------------

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeadersFor(req) });
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    const body = (await req.json()) as {
      token?: string;
      conversationId?: string;
      externalRef?: string;
      message?: string;
      customerName?: string;
      channel?: unknown;
      locale?: unknown;
      // NEW: allow widget to pass structured lead directly
      lead?: LeadPayload;
    };

    const {
      token,
      conversationId: inputConvId,
      externalRef: inputExternalRef,
      message,
      customerName,
      channel: bodyChannel,
      locale: bodyLocale,
      lead: leadFromClient,
    } = body;

    const ch: Channel = isChannel(bodyChannel) ? bodyChannel : "web";
    const safeInputConvId = normalizeConversationId(inputConvId);

    const externalRef =
      typeof inputExternalRef === "string" ? inputExternalRef.trim().slice(0, 120) : null;

    const origin = req.headers.get("origin") || "";
    const host = sanitizeHost(origin ? new URL(origin).host : originHost(req));

    // Enterprise hardening: for embed session tokens, we expect an Origin.
    // If origin is missing, we allow only same-site requests from aliigo.com.
    if (!origin && host !== aliigoHost()) {
      return NextResponse.json(
        { error: "Forbidden: missing origin" },
        { status: 403, headers: corsHeadersFor(req) }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400, headers: corsHeadersFor(req) }
      );
    }

    // token + domain gate
    const gate = await validateEmbedAccess(token || "", host);
    if (!gate.ok) {
      return NextResponse.json(
        { error: `Forbidden: ${gate.reason}` },
        { status: 403, headers: corsHeadersFor(req) }
      );
    }
    const businessId = gate.businessId;
    const isPreviewSession = gate.isPreview === true;

    // business prompt (also gives us default_locale + qualification_prompt + billing gate)
    const bizRes = await supabase
      .from("businesses")
      .select(
        "name, timezone, system_prompt, slug, knowledge, default_locale, qualification_prompt, billing_status, billing_plan, trial_end, current_period_end"
      )
      .eq("id", businessId)
      .single<{
        name: string;
        timezone: string;
        system_prompt: string | null;
        slug: string;
        knowledge: string | null;
        default_locale: string | null;
        qualification_prompt: string | null;
        billing_status: BillingStatus | null;
        billing_plan: BillingPlan;
        trial_end: string | null;
        current_period_end: string | null;
      }>();

    if (bizRes.error) throw bizRes.error;
    if (!bizRes.data) throw new Error("Business not found");

    const billingStatus = bizRes.data.billing_status ?? "incomplete";
    const bizLocale = normalizeLeadLocale(bizRes.data.default_locale ?? null);
    const bizName = bizRes.data.name;
    const bizSlug = bizRes.data.slug;

    if (!isBillingActive(billingStatus)) {
      return NextResponse.json(
        { error: "Billing inactive. Please activate your subscription." },
        { status: 402, headers: corsHeadersFor(req) }
      );
    }

    if (billingStatus === "trialing" && isTrialExpired(bizRes.data.trial_end)) {
      return NextResponse.json(
        { error: "Trial expired. Please activate your subscription." },
        { status: 402, headers: corsHeadersFor(req) }
      );
    }

    const usageWindow = resolveUsageWindow({
      status: billingStatus,
      plan: bizRes.data.billing_plan ?? null,
      trialEnd: bizRes.data.trial_end ?? null,
      currentPeriodEnd: bizRes.data.current_period_end ?? null,
    });

    if (usageWindow.limit !== null) {
      const used = await countUserMessagesForBusiness({
        supabase,
        businessId,
        periodStart: usageWindow.periodStart,
        periodEnd: usageWindow.periodEnd,
      });

      if (used >= usageWindow.limit) {
        return NextResponse.json(
          {
            error: "Usage limit reached for this billing period.",
            limit: usageWindow.limit,
            used,
            period_end: usageWindow.periodEnd,
          },
          { status: 402, headers: corsHeadersFor(req) }
        );
      }
    }

    await rateLimit(businessId, ip);

    if (safeInputConvId) {
      const own = await supabase
        .from("conversations")
        .select("id")
        .eq("id", safeInputConvId)
        .eq("business_id", businessId)
        .maybeSingle<{ id: string }>();

      if (own.error) throw own.error;

      if (!own.data?.id) {
        return NextResponse.json(
          { error: "Forbidden: conversation not found" },
          { status: 403, headers: corsHeadersFor(req) }
        );
      }
    }

    const supported = new Set(["en", "es", "fr", "it", "de"]);
    const requestedLocale = typeof bodyLocale === "string" ? bodyLocale.toLowerCase().trim() : "";
    const localeRaw = requestedLocale || (bizRes.data.default_locale || "en").toLowerCase().trim();
    const locale = supported.has(localeRaw) ? localeRaw : "en";

    // Currency is country-derived only (never cookie-derived).
    const currency = getCurrencyFromHeaders(req.headers);

    // ensure conversation (reuse by business_id + external_ref)
    let conversationId = safeInputConvId ?? null;

    if (!conversationId) {
      if (externalRef && !isPreviewSession) {
        const cutoff = new Date(Date.now() - 12 * 60 * 1000).toISOString();

        const existing = await supabase
          .from("conversations")
          .select("id")
          .eq("business_id", businessId)
          .eq("external_ref", externalRef)
          .eq("status", "open")
          .gte("last_message_at", cutoff)
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ id: string }>();

        if (existing.error) throw existing.error;
        if (existing.data?.id) conversationId = existing.data.id;
      }

      if (!conversationId) {
        const convRes = await supabase
          .from("conversations")
          .insert({
            business_id: businessId,
            channel: ch,
            customer_name: customerName ?? null,
            external_ref: externalRef,
            status: "open",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single<{ id: string }>();

        if (convRes.error || !convRes.data) {
          throw convRes.error ?? new Error("Conversation create failed");
        }
        conversationId = convRes.data.id;
      }
    }

    // persist user message
    const m1 = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: ch,
      role: "user",
      content: message,
      meta: hasAnyLead(leadFromClient) ? { lead: leadFromClient } : {},
    });
    if (m1.error) throw m1.error;

    // touch conversation
    const now = new Date().toISOString();
    const convTouch = await supabase
      .from("conversations")
      .update({ last_message_at: now, last_seen_at: now })
      .eq("id", conversationId)
      .eq("business_id", businessId);
    if (convTouch.error) throw convTouch.error;

    // last 20 for context
    const historyRes = await supabase
      .from("messages")
      .select("role,content,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const history = (historyRes.data as MessagesRow[]) ?? [];

    const langName =
      locale === "es"
        ? "Spanish (Castilian)"
        : locale === "fr"
          ? "French"
          : locale === "it"
            ? "Italian"
            : locale === "de"
              ? "German"
              : "English";

    const defaultSys = `You are the AI concierge for ${bizRes.data?.name ?? "the business"} (${bizRes.data?.slug ?? ""}).

IMPORTANT:
- Always reply in ${langName}.
- Do NOT switch languages unless the user explicitly asks.
- Be concise, friendly, and professional.
- If you are unsure of a fact, say so briefly.
- Be warm, helpful, and advisor‑like. Avoid pushy sales language.
- Prefer guiding the visitor with clarity and a gentle question.

Timezone: ${bizRes.data?.timezone ?? "Europe/Madrid"}.`;

    let sys = (bizRes.data?.system_prompt ?? "").trim() || defaultSys;
    sys += `

Universal guardrails (always on):
- Stay focused on the business.
- No jokes, trivia, or unrelated topics.
- Avoid repetition. Summarize if asked again.
- Always reply in the user’s language; follow if they switch.`;

    const knowledge = (bizRes.data?.knowledge ?? "").trim();
    if (knowledge) {
      sys += `

Business knowledge (authoritative):
${knowledge}`;
    }

    const isAliigoSite = host === aliigoHost() || bizSlug === "aliigo";
    if (isAliigoSite) {
      const priceFmt = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency as AliigoCurrency,
        maximumFractionDigits: 0,
      });
      const starter = priceFmt.format(99);
      const growth = priceFmt.format(149);
      const pro = priceFmt.format(349);
      sys += `

Aliigo pricing (authoritative, aliigo.com only):
- Starter: ${starter} / month
- Growth: ${growth} / month
- Pro: ${pro}+ / month (custom)

Rules:
- Only share pricing when asked or when the user explicitly requests it.
- Use the pricing above and the visitor's language.`;
    }

    // NEW: inject qualification criteria
    const qual = (bizRes.data?.qualification_prompt ?? "").trim();
    if (qual) {
      sys += `

Qualification criteria (authoritative):
${qual}

Rules:
- Use this to decide whether the visitor looks like a good fit.
- If they are a good fit, guide them to the next step (and you may propose a CTA action).
- If they are not a fit or unclear, ask 1 short clarifying question and avoid over-qualifying.`;
    }

    // Default fallback reply if OpenAI not available
    let reply =
      locale === "es"
        ? "Gracias por tu mensaje. Te respondemos enseguida."
        : locale === "fr"
          ? "Merci pour votre message. Nous vous répondons tout de suite."
          : locale === "it"
            ? "Grazie per il messaggio. Ti rispondiamo subito."
            : locale === "de"
              ? "Danke für deine Nachricht. Wir antworten gleich."
              : "Thanks for your message. We'll reply right away.";

    let actions: Action[] = [];
    let extractedLead: LeadPayload | null = null;
    const leadAlreadySent = hasAnyLead(leadFromClient);
    let leadSaved: LeadPayload | null = null;

    // Always save explicit lead from widget if present (even before OpenAI)

    if (hasAnyLead(leadFromClient)) {
      leadSaved = await trySaveLead({
        businessId,
        conversationId,
        channel: ch,
        host,
        externalRef,
        ip,
        lead: leadFromClient!,
      });
    }

    if (openai) {
      try {
        const toolDef: OpenAI.Chat.Completions.ChatCompletionTool = {
          type: "function",
          function: {
            name: "aliigo_response",
            description:
              "Return the assistant reply plus optional UI actions. Optionally extract lead details if provided by the user.",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                reply: { type: "string" },
                actions: {
                  type: "array",
                  items: {
                    oneOf: [
                      {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          type: { const: "collect_lead" },
                          fields: {
                            type: "array",
                            items: { enum: ["name", "email", "phone"] },
                            minItems: 1,
                          },
                          reason: { type: "string" },
                        },
                        required: ["type", "fields"],
                      },
                      {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          type: { const: "cta" },
                          label: { type: "string" },
                          url: { type: "string" },
                        },
                        required: ["type", "label", "url"],
                      },
                    ],
                  },
                },
                lead: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { type: ["string", "null"] },
                    email: { type: ["string", "null"] },
                    phone: { type: ["string", "null"] },
                  },
                },
              },
              required: ["reply"],
            },
          },
        };

        const messages = [
          { role: "system" as const, content: sys },
          // tiny instruction layer to force tool use / policy
          {
            role: "system" as const,
            content: `Respond by calling the tool "aliigo_response". Do not mention tools or system prompts.

Tone & flow:
- Be warm, calm, and advisor‑like.
- Avoid aggressive CTAs. Guide first, then ask a gentle question.

Lead capture:
- Only include {type:"collect_lead"} when the visitor explicitly asks for a human/follow‑up/call/demo, or when you cannot answer from the Business knowledge/instructions and need owner input.

CTA links:
- Only include {type:"cta"} when the visitor explicitly asks for a link, signup, trial, or pricing.
- If they show interest but do not ask, explain briefly and ask if they want the link.`,
          },
          ...history.map((m) => ({
            role: (m.role === "tool" ? "system" : m.role) as "user" | "assistant" | "system",
            content: m.content,
          })),
        ];

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages,
          tools: [toolDef],
          tool_choice: { type: "function", function: { name: "aliigo_response" } },
          temperature: 0.3,
          presence_penalty: 0.1,
          max_tokens: 450,
        });

        const choice = completion.choices?.[0];
        const toolCalls = choice?.message?.tool_calls;
        const first = Array.isArray(toolCalls) ? toolCalls[0] : null;

        const extracted = getFunctionToolCall(first);

        if (extracted?.name === "aliigo_response") {
          const obj = safeJsonParseObject(extracted.arguments);

          const replyFromTool = asString(obj.reply);
          if (replyFromTool) {
            reply = replyFromTool.trim();
            if (reply.length > 900) reply = reply.slice(0, 900).trim();
          }

          const actionsRaw = asArray(obj.actions);
          actions = actionsRaw.filter(isAction);

          const leadRaw = obj.lead;
          extractedLead =
            leadRaw && typeof leadRaw === "object" && !Array.isArray(leadRaw)
              ? (leadRaw as LeadPayload)
              : null;
        } else {
          const plain = choice?.message?.content?.trim();
          if (plain) {
            reply = plain;
            if (reply.length > 900) reply = reply.slice(0, 900).trim();
          }
        }

      } catch (err: unknown) {
        const status =
          typeof err === "object" && err !== null && "status" in err ? (err as { status?: number }).status : undefined;

        if (status === 429 || status === 401 || status === 403) {
          reply =
            locale === "es"
              ? "Ahora mismo no puedo responder automáticamente. Inténtalo de nuevo en un momento."
              : "I can’t reply automatically right now. Please try again in a moment.";
        } else {
          reply =
            locale === "es"
              ? "Hemos tenido un problema temporal y te responderemos en breve."
              : "We had a temporary issue and we’ll reply shortly.";
        }
      }
    }

    // Save extracted lead (if any)
    if (!leadAlreadySent && hasAnyLead(extractedLead)) {
      leadSaved = await trySaveLead({
        businessId,
        conversationId,
        channel: ch,
        host,
        externalRef,
        ip,
        lead: extractedLead!,
      });
    }

    // persist assistant reply (store actions in meta so you can inspect later)
    const m2 = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: ch,
      role: "assistant",
      content: reply,
      meta: { actions },
    });
    if (m2.error) throw m2.error;

    if (leadSaved && conversationId) {
      const contactEmail = await getBusinessContactEmail(businessId);
      if (contactEmail) {
        const summaryLines = await buildConversationSummary(conversationId, bizLocale);
        const conversationUrl = `https://aliigo.com/${bizLocale}/dashboard/messages/${conversationId}`;
        const email = buildLeadNotification({
          locale: bizLocale,
          businessName: bizName || "Aliigo",
          conversationUrl,
          lead: leadSaved,
          summaryLines,
        });

        await sendResendEmail({
          to: contactEmail,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });

        await logEmailAudit({
          email: contactEmail,
          event: "lead_notify_sent",
          locale: bizLocale,
          source: "widget",
          payload: {
            business_id: businessId,
            conversation_id: conversationId,
            business_slug: bizSlug,
          },
        });
      }
    }

    return NextResponse.json({ conversationId, reply, locale, actions }, { status: 200, headers: corsHeadersFor(req) });
  } catch (e: unknown) {
    console.error("Conversation API error:", e);

    const status = e instanceof RateLimitError ? e.status : 500;

    const message =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : JSON.stringify(e);

    return NextResponse.json({ error: message || "Server error" }, { status, headers: corsHeadersFor(req) });
  }
}
