// src/app/api/conversation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { originHost, hostAllowed } from "@/lib/embedGate";


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
  constructor(m = "Rate limited") { super(m); }
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


function embedHostFromReq(req: NextRequest): string {
  // Prefer explicit host passed in referer: /es/chat?...&host=asociacion-avast.org
  const ref = req.headers.get("referer") || "";
  try {
    const u = new URL(ref);
    const h = (u.searchParams.get("host") || "").trim().toLowerCase();
    return h.replace(/:\d+$/, "");
  } catch {
    return "";
  }
}

// --- lead intent heuristic (simple keywords; expand as needed) ---
function wantsLead(s: string) {
  return /precio|presupuesto|cita|reserva|comprar|contratar|cotización|quote|price|book|schedule|estimate|budget/i.test(s || "");
}

async function rateLimit(businessId: string, ip: string) {
  const WINDOW_MS = process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000;
  const LIMIT = process.env.NODE_ENV === "production" ? 20 : 1000;

  const ins = await supabase.from("rate_events").insert({
    ip, bucket: `chat:${businessId}`, business_id: businessId,
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

    return { ok: true as const, businessId: sess.data.business_id };
  }

  // 2) legacy fallback (keep temporarily; remove later)
  const tok = await supabase
    .from("embed_tokens")
    .select("business_id")
    .eq("token", token)
    .single();

  if (tok.error || !tok.data) return { ok: false as const, reason: "Invalid token" };

  const biz = await supabase
    .from("businesses")
    .select("id,allowed_domains")
    .eq("id", tok.data.business_id)
    .single();

  if (biz.error || !biz.data) return { ok: false as const, reason: "Business missing" };
  if (!hostAllowed(host, biz.data.allowed_domains)) {
    return { ok: false as const, reason: "Domain not allowed" };
  }

  return { ok: true as const, businessId: biz.data.id };
}


export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeadersFor(req) });
}

export async function POST(req: NextRequest) {
  // TEMP DEBUG (remove after)
  const dbg = new URL(req.url).searchParams.get("debug") === "1";
  if (dbg) {
    return NextResponse.json(
      {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLen: (process.env.OPENAI_API_KEY || "").length,
        model: process.env.OPENAI_MODEL || null,
        nodeEnv: process.env.NODE_ENV || null,
      },
      { status: 200 }
    );
  }
  try {
    const ip = clientIp(req);

    // 1) Parse body first
    const {
      token,
      conversationId: inputConvId,
      message,
      customerName,
      channel: bodyChannel,
      locale: bodyLocale,
    } = (await req.json()) as {
      token?: string;
      conversationId?: string;
      message?: string;
      customerName?: string;
      host?: string;
      channel?: unknown;
      locale?: unknown;
    };

    const ch: Channel = isChannel(bodyChannel) ? bodyChannel : "web";

    // 2) Then compute host
    const origin = req.headers.get("origin") || "";
    const host = sanitizeHost(originHost(req));

    // Enterprise hardening: for embed session tokens, we expect an Origin.
    // If origin is missing, we allow only same-site requests from aliigo.com.
    if (!origin && host !== aliigoHost()) {
      return NextResponse.json(
        { error: "Forbidden: missing origin" },
        { status: 403, headers: corsHeadersFor(req) }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400, headers: corsHeadersFor(req) }
      );
    }

    // token + domain gate
    const gate = await validateEmbedAccess(token || "", host);
    if (!gate.ok) {
      return NextResponse.json({ error: `Forbidden: ${gate.reason}` }, { status: 403, headers: corsHeadersFor(req) });
    }
    const businessId = gate.businessId;

    await rateLimit(businessId, ip);

    if (inputConvId) {
      const own = await supabase
        .from("conversations")
        .select("id")
        .eq("id", inputConvId)
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

    // business prompt (also gives us default_locale)
    const bizRes = await supabase
      .from("businesses")
      .select("name, timezone, system_prompt, slug, knowledge, default_locale")
      .eq("id", businessId)
      .single<{
        name: string;
        timezone: string;
        system_prompt: string | null;
        slug: string;
        knowledge: string | null;
        default_locale: string | null;
      }>();

    if (bizRes.error) throw bizRes.error;
    if (!bizRes.data) throw new Error("Business not found");

    const supported = new Set(["en", "es", "fr", "it", "de"]);

    const requestedLocale =
      typeof bodyLocale === "string" ? bodyLocale.toLowerCase().trim() : "";

    const localeRaw = requestedLocale || (bizRes.data.default_locale || "en").toLowerCase().trim();
    const locale = supported.has(localeRaw) ? localeRaw : "en";

    // ensure conversation
    let conversationId = inputConvId ?? null;
    if (!conversationId) {
      const convRes = await supabase
        .from("conversations")
        .insert({
          business_id: businessId,
          channel: ch,
          customer_name: customerName ?? null,
        })
        .select("id")
        .single<{ id: string }>();

      if (convRes.error || !convRes.data) {
        throw convRes.error ?? new Error("Conversation create failed");
      }
      conversationId = convRes.data.id;
    }

    // persist user message
    const m1 = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: ch,
      role: "user",
      content: message,
      meta: {},
    });
    if (m1.error) throw m1.error;

    // last 20 for context
    const historyRes = await supabase
      .from("messages")
      .select("role,content,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);
    const history = (historyRes.data as MessagesRow[]) ?? [];



    const langName =
      locale === "es" ? "Spanish (Castilian)" :
        locale === "fr" ? "French" :
          locale === "it" ? "Italian" :
            locale === "de" ? "German" :
              "English";

    const defaultSys = `You are the AI concierge for ${bizRes.data?.name ?? "the business"} (${bizRes.data?.slug ?? ""}).

    IMPORTANT:
    - Always reply in ${langName}.
    - Do NOT switch languages unless the user explicitly asks.
    - Be concise, friendly, and professional.

    Timezone: ${bizRes.data?.timezone ?? "Europe/Madrid"}.
    If you are unsure of a fact, say so briefly.`;

    let sys = (bizRes.data?.system_prompt ?? "").trim() || defaultSys;

    const knowledge = (bizRes.data?.knowledge ?? "").trim();
    if (knowledge) {
      sys += `

    Business knowledge (authoritative): 
    ${knowledge}

    Rules:
    - Prefer the business knowledge when answering.
    - If the knowledge does not cover it, say so briefly and ask 1 follow-up question.`;
    }
    // lead intent → collect contact details
    if (wantsLead(message)) {
      sys += `

    Lead intent detected.
    - Ask for full name, email, and phone in ONE short message.
    - After collecting, confirm we'll contact them soon and offer to keep answering questions.
    - Keep it under ~4 sentences. Do not invent prices or guarantees.`;
    }

    // reply
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


    if (openai) {
      try {
        const messages = [
          { role: "system" as const, content: sys },
          ...history.map((m) => ({
            role: (m.role === "tool" ? "system" : m.role) as
              | "user"
              | "assistant"
              | "system",
            content: m.content,
          })),
        ];

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages,
          temperature: 0.3,
          max_tokens: 300,
        });

        reply = completion.choices?.[0]?.message?.content?.trim() || reply;
      } catch (err: unknown) {
        // OpenAI SDK errors often expose `status` (number) but we keep this lint-safe.
        const status =
          typeof err === "object" && err !== null && "status" in err
            ? (err as { status?: number }).status
            : undefined;

        if (status === 429 || status === 401 || status === 403) {
          reply =
            locale === "es"
              ? "Gracias por tu mensaje. Ahora mismo no puedo responder automáticamente. Déjanos tu nombre y un teléfono o email y te contactamos enseguida."
              : locale === "fr"
                ? "Merci pour votre message. Je ne peux pas répondre automatiquement pour le moment. Laissez votre nom et un téléphone ou email et nous vous contacterons rapidement."
                : locale === "it"
                  ? "Grazie per il messaggio. In questo momento non posso rispondere automaticamente. Lascia nome e telefono o email e ti contatteremo a breve."
                  : locale === "de"
                    ? "Danke für deine Nachricht. Ich kann gerade nicht automatisch antworten. Bitte nenne deinen Namen und eine Telefonnummer oder E-Mail, dann melden wir uns kurzfristig."
                    : "Thanks for your message. I can’t reply automatically right now. Share your name and a phone or email and we’ll reach out shortly.";
        } else {
          reply =
            locale === "es"
              ? "Gracias por tu mensaje. Hemos tenido un problema temporal y te responderemos en breve."
              : locale === "fr"
                ? "Merci pour votre message. Nous avons eu un problème temporaire et nous vous répondrons bientôt."
                : locale === "it"
                  ? "Grazie per il messaggio. Abbiamo avuto un problema temporaneo e ti risponderemo a breve."
                  : locale === "de"
                    ? "Danke für deine Nachricht. Es gab ein temporäres Problem. Wir melden uns in Kürze."
                    : "Thanks for your message. We had a temporary issue and we’ll reply shortly.";
        }
      }
    }


    // persist assistant reply
    const m2 = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: ch,
      role: "assistant",
      content: reply,
      meta: {},
    });
    if (m2.error) throw m2.error;

    return NextResponse.json({ conversationId, reply, locale }, { status: 200, headers: corsHeadersFor(req) });
    } catch (e: unknown) {
      console.error("Conversation API error:", e);

      const status = e instanceof RateLimitError ? e.status : 500;

      const message =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : JSON.stringify(e);

      return NextResponse.json(
        { error: message || "Server error" },
        { status, headers: corsHeadersFor(req) }
      );
    }
  }
