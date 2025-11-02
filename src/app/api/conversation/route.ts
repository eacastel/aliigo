// src/app/api/conversation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// server-only admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type ChatRole = "user" | "assistant" | "system" | "tool";
type MessagesRow = { role: ChatRole; content: string; created_at: string };

class RateLimitError extends Error { status = 429 as const; constructor(m="Rate limited"){ super(m);} }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function clientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "0.0.0.0";
}
function originHost(req: NextRequest) {
  const raw = req.headers.get("origin") || req.headers.get("referer") || "";
  try { return new URL(raw).hostname.toLowerCase(); } catch { return ""; }
}

async function rateLimit(businessId: string, ip: string) {
  // Dev: make it lenient
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

async function validateEmbedAccess(token: string, host: string) {
  if (!token) return { ok: false as const, reason: "Missing token" };
  if (!host) return { ok: false as const, reason: "Missing host" };

  const tok = await supabase.from("embed_tokens")
    .select("business_id").eq("token", token).single();
  if (tok.error || !tok.data) return { ok: false as const, reason: "Invalid token" };

  const biz = await supabase.from("businesses")
    .select("id,allowed_domains").eq("id", tok.data.business_id).single();
  if (biz.error || !biz.data) return { ok: false as const, reason: "Business missing" };

  const allowed = (biz.data.allowed_domains || []).map((d: string) => d.toLowerCase());
  const ok = allowed.some((d: string) => host === d || host.endsWith(`.${d}`));
  if (!ok) return { ok: false as const, reason: "Domain not allowed" };

  return { ok: true as const, businessId: biz.data.id };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const host = originHost(req);
    const { token, conversationId: inputConvId, message, customerName } =
      (await req.json()) as {
        token?: string;
        conversationId?: string;
        message?: string;
        customerName?: string;
      };

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400, headers: corsHeaders });
    }

    // validate token + host
    const gate = await validateEmbedAccess(token || "", host);
    if (!gate.ok) {
      return NextResponse.json({ error: `Forbidden: ${gate.reason}` }, { status: 403, headers: corsHeaders });
    }
    const businessId = gate.businessId;

    await rateLimit(businessId, ip);

    // ensure conversation
    let conversationId = inputConvId ?? null;
    if (!conversationId) {
      const convRes = await supabase
        .from("conversations")
        .insert({ business_id: businessId, channel: "web", customer_name: customerName ?? null })
        .select("id")
        .single<{ id: string }>();
      if (convRes.error || !convRes.data) throw convRes.error ?? new Error("Conversation create failed");
      conversationId = convRes.data.id;
    }

    // persist user message
    const m1 = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: "web",
      role: "user",
      content: message,
    });
    if (m1.error) throw m1.error;

    // get last 20 for context
    const historyRes = await supabase
      .from("messages")
      .select("role,content,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);
    const history = (historyRes.data as MessagesRow[]) ?? [];

    // business prompt
    const bizRes = await supabase
      .from("businesses")
      .select("name, timezone, system_prompt")
      .eq("id", businessId)
      .single<{ name: string; timezone: string; system_prompt: string | null }>();
    const sys =
      (bizRes.data?.system_prompt ?? "").trim() ||
      `You are the AI assistant for ${bizRes.data?.name ?? "the business"}. Be concise, helpful, and polite. Timezone: ${bizRes.data?.timezone ?? "UTC"}.`;

    let reply = "Gracias por tu mensaje. Te respondemos enseguida.";
    if (openai) {
      const messages = [
        { role: "system" as const, content: sys },
        ...history.map((m) => ({
          role: (m.role === "tool" ? "system" : m.role) as "user" | "assistant" | "system",
          content: m.content,
        })),
      ];
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        max_tokens: 300,
      });
      reply = completion.choices?.[0]?.message?.content?.trim() || reply;
    }

    // persist assistant reply
    const m2 = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: "web",
      role: "assistant",
      content: reply,
    });
    if (m2.error) throw m2.error;

    return NextResponse.json({ conversationId, reply }, { status: 200, headers: corsHeaders });
  } catch (e: unknown) {
    const status = e instanceof RateLimitError ? e.status : 500;
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status, headers: corsHeaders });
  }
}
