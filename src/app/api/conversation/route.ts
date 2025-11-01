import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only key
  { auth: { persistSession: false } }
);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type ChatRole = "user" | "assistant" | "system" | "tool";

type MessagesRow = {
  role: ChatRole;
  content: string;
  created_at: string;
};

type BusinessRow = {
  id: string;
  name: string;
  timezone: string;
};

class RateLimitError extends Error {
  status = 429 as const;
  constructor(message = "Rate limited") {
    super(message);
    this.name = "RateLimitError";
  }
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "0.0.0.0";
}

async function rateLimit(businessId: string, ip: string): Promise<void> {
  // 20 messages / 5 minutes per business+IP
  const WINDOW_MS = 5 * 60 * 1000;
  const LIMIT = 20;

  const insertRes = await supabase.from("rate_events").insert({
    ip,
    bucket: "webchat:send",
    business_id: businessId,
  });
  if (insertRes.error) throw insertRes.error;

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const countRes = await supabase
    .from("rate_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since)
    .eq("ip", ip)
    .eq("bucket", "webchat:send")
    .eq("business_id", businessId);

  if (countRes.error) throw countRes.error;
  if ((countRes.count ?? 0) > LIMIT) throw new RateLimitError();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = clientIp(req);
    const body = (await req.json()) as {
      businessSlug?: string;
      conversationId?: string;
      message?: string;
      customerName?: string;
    };

    const { businessSlug, conversationId: inputConvId, message, customerName } = body;

    if (!businessSlug || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1) Resolve business
    const bizRes = await supabase
      .from("businesses")
      .select("id,name,timezone")
      .eq("slug", businessSlug)
      .single<BusinessRow>();
    if (bizRes.error || !bizRes.data) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    const biz = bizRes.data;

    // 2) Rate limit (per business+IP)
    await rateLimit(biz.id, ip);

    // 3) Ensure conversation
    let conversationId = inputConvId ?? null;
    if (!conversationId) {
      const convRes = await supabase
        .from("conversations")
        .insert({
          business_id: biz.id,
          channel: "web",
          customer_name: customerName ?? null,
        })
        .select("id")
        .single<{ id: string }>();
      if (convRes.error || !convRes.data) throw convRes.error ?? new Error("Conversation create failed");
      conversationId = convRes.data.id;
    }

    // 4) Persist user message
    const msgRes = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: "web",
      role: "user",
      content: message,
    });
    if (msgRes.error) throw msgRes.error;

    // 5) Build short history (last 20)
    const historyRes = await supabase
      .from("messages")
      .select("role,content,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20)
      .returns<MessagesRow[]>();
    const history = historyRes.data ?? [];

    const system = `You are the AI assistant for ${biz.name}. Be concise, helpful, and polite. Timezone: ${biz.timezone}. If you need contact details or booking steps, ask for them.`;

    // 6) Get reply (OpenAI if configured; otherwise a stub)
    let reply = "Gracias por tu mensaje. Te respondemos enseguida.";
    if (openai) {
      const messages = [
        { role: "system" as const, content: system },
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

    // 7) Persist assistant reply
    const aRes = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: "web",
      role: "assistant",
      content: reply,
    });
    if (aRes.error) throw aRes.error;

    return NextResponse.json({ conversationId, reply }, { status: 200 });
  } catch (e: unknown) {
    const status = e instanceof RateLimitError ? e.status : 500;
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status });
  }
}
