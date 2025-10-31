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

function clientIp(req: NextRequest) {
  // Works on Vercel/Next; first IP in x-forwarded-for
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "0.0.0.0";
}

async function rateLimit(businessId: string, ip: string) {
  // 20 messages / 5 minutes per business+IP
  const WINDOW_MS = 5 * 60 * 1000;
  const LIMIT = 20;

  await supabase.from("rate_events").insert({
    ip,
    bucket: "webchat:send",
    business_id: businessId,
  });

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from("rate_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since)
    .eq("ip", ip)
    .eq("bucket", "webchat:send")
    .eq("business_id", businessId);

  if (error) throw error;
  if ((count ?? 0) > LIMIT) {
    const err = new Error("Rate limited");
    // @ts-expect-error attach status
    err.status = 429;
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const body = await req.json();

    const {
      businessSlug,
      conversationId: inputConvId,
      message,
      customerName,
    }: {
      businessSlug: string;
      conversationId?: string;
      message: string;
      customerName?: string;
    } = body || {};

    if (!businessSlug || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1) Resolve business
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id,name,timezone")
      .eq("slug", businessSlug)
      .single();
    if (bizErr || !biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 2) Rate limit (per business+IP)
    await rateLimit(biz.id, ip);

    // 3) Ensure conversation
    let conversationId = inputConvId || null;
    if (!conversationId) {
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          business_id: biz.id,
          channel: "web",
          customer_name: customerName || null,
        })
        .select("id")
        .single();
      if (convErr) throw convErr;
      conversationId = conv.id;
    }

    // 4) Persist user message
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: "web",
      role: "user",
      content: message,
    });
    if (msgErr) throw msgErr;

    // 5) Build short history (last 20)
    const { data: history } = await supabase
      .from("messages")
      .select("role,content,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const system = `You are the AI assistant for ${biz.name}. Be concise, helpful, and polite. Timezone: ${biz.timezone}. If you need contact details or booking steps, ask for them.`;

    // 6) Get reply (OpenAI if configured; otherwise a stub)
    let reply = "Gracias por tu mensaje. Te respondemos enseguida.";
    if (openai) {
      const messages = [
        { role: "system" as const, content: system },
        ...(history || []).map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ];
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        max_tokens: 300,
      });
      reply =
        completion.choices?.[0]?.message?.content?.trim() ||
        reply;
    }

    // 7) Persist assistant reply
    const { error: aErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      channel: "web",
      role: "assistant",
      content: reply,
    });
    if (aErr) throw aErr;

    return NextResponse.json({ conversationId, reply }, { status: 200 });
  } catch (e: any) {
    const status = e?.status ?? (e?.message === "Rate limited" ? 429 : 500);
    return NextResponse.json({ error: e?.message || "Server error" }, { status });
  }
}
