// app/api/conversation/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // <-- server-only client

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- Types local to this route ---------- */
type ChatRole = "user" | "assistant" | "system" | "tool";
type MessagesRow = { role: ChatRole; content: string; created_at: string };

/* ---------- OpenAI (optional) ---------- */
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/* ---------- Helpers ---------- */
class RateLimitError extends Error {
  status = 429 as const;
  constructor(message = "Rate limited") {
    super(message);
    this.name = "RateLimitError";
  }
}

const corsHeaders: Record<string, string> = {
  // If you want stricter CORS, echo the exact origin instead of "*"
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "0.0.0.0";
}

function originHost(req: NextRequest): string {
  const raw = req.headers.get("origin") || req.headers.get("referer") || "";
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return "";
  }
}

async function rateLimit(businessId: string, ip: string): Promise<void> {
  // 20 messages / 5 minutes per business+IP
  const WINDOW_MS = 5 * 60 * 1000;
  const LIMIT = 20;

  const ins = await supabaseAdmin.from("rate_events").insert({
    ip,
    bucket: `chat:${businessId}`,
    business_id: businessId,
  });
  if (ins.error) throw ins.error;

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const countRes = await supabaseAdmin
    .from("rate_events")
    .select("*", { head: true, count: "exact" })
    .gte("created_at", since)
    .eq("ip", ip)
    .eq("business_id", businessId)
    .eq("bucket", `chat:${businessId}`);

  if (countRes.error) throw countRes.error;
  if ((countRes.count ?? 0) > LIMIT) throw new RateLimitError();
}

/** Validate token + domain before allowing chat */
async function validateEmbedAccess(token: string, host: string): Promise<
  | { ok: true; businessId: string }
  | { ok: false; reason: string }
> {
  if (!token) return { ok: false, reason: "Missing token" };
  if (!host) return { ok: false, reason: "Missing host" };

  // 1) Resolve the business by token
  const tok = await supabaseAdmin
    .from("embed_tokens")
    .select("business_id")
    .eq("token", token)
    .single();
  if (tok.error || !tok.data) return { ok: false, reason: "Invalid token" };

  // 2) Validate allowed domains
  const biz = await supabaseAdmin
    .from("businesses")
    .select("id, allowed_domains")
    .eq("id", tok.data.business_id)
    .single();
  if (biz.error || !biz.data) return { ok: false, reason: "Business missing" };

  const allowed = (biz.data.allowed_domains || []).map((d: string) => d.toLowerCase());
  const hostOk = allowed.some((d: string) => host === d || host.endsWith(`.${d}`));
  if (!hostOk) return { ok: false, reason: "Domain not allowed" };

  return { ok: true, businessId: biz.data.id };
}

/* ---------- CORS preflight ---------- */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/* ---------- POST ---------- */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const host = originHost(req);

    // The widget should send { token, message, conversationId?, customerName? }
    const {
      token,
      conversationId: inputConvId,
      message,
      customerName,
    }: {
      token?: string;
      conversationId?: string;
      message?: string;
      customerName?: string;
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400, headers: corsHeaders });
    }

    // 🔐 Gate: token + domain
    const gate = await validateEmbedAccess(token || "", host);
    if (!gate.ok) {
      return NextResponse.json({ error: `Forbidden: ${gate.reason}` }, { status: 403, headers: corsHeaders });
    }
    const businessId = gate.businessId;

    // Rate limit
    await rateLimit(businessId, ip);

    // Ensure conversation
    let conversationId = inputConvId ?? null;
    if (!conversationId) {
      const convRes = await supabaseAdmin
        .from("conversations")
        .insert({
          business_id: businessId,
          channel: "web",
          customer_name: customerName ?? null,
        })
        .select("id")
        .single<{ id: string }>();
      if (convRes.error || !convRes.data) throw convRes.error ?? new Error("Conversation create failed");
      conversationId = convRes.data.id;
    }

    // Save user message
    const msgIns = await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      channel: "web",
      role: "user",
      content: message,
    });
    if (msgIns.error) throw msgIns.error;

    // Fetch last 20 messages (ordered)
    const historyRes = await supabaseAdmin
      .from("messages")
      .select("role,content,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);
    const history = (historyRes.data as MessagesRow[]) ?? [];

    // Business context for system prompt
    const bizRes = await supabaseAdmin
      .from("businesses")
      .select("name, timezone, system_prompt")
      .eq("id", businessId)
      .single<{ name: string; timezone: string; system_prompt: string | null }>();

    const bizName = bizRes.data?.name ?? "your business";
    const tz = bizRes.data?.timezone ?? "UTC";
    const systemPrompt =
      (bizRes.data?.system_prompt ?? "").trim() ||
      `You are the AI assistant for ${bizName}. Be concise, helpful, and polite. Timezone: ${tz}.`;

    // AI reply (fallback if OPENAI_API_KEY not set)
    let reply = "Gracias por tu mensaje. Te respondemos enseguida.";
    if (openai) {
      const messages = [
        { role: "system" as const, content: systemPrompt },
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

    // Persist assistant reply
    const aRes = await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      channel: "web",
      role: "assistant",
      content: reply,
    });
    if (aRes.error) throw aRes.error;

    return NextResponse.json({ conversationId, reply }, { status: 200, headers: corsHeaders });
  } catch (e: unknown) {
    const status = e instanceof RateLimitError ? e.status : 500;
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status, headers: corsHeaders });
  }
}
