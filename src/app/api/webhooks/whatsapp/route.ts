import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  extractInboundTextMessages,
  resolveBusinessIdForPhoneNumber,
  sendWhatsAppText,
  verifyWhatsAppSignature,
} from "@/lib/whatsapp";
import { effectivePlanForEntitlements, isGrowthOrHigher } from "@/lib/effectivePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function appBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256");
    const signatureOk = verifyWhatsAppSignature({
      rawBody,
      signatureHeader,
      appSecret: process.env.META_APP_SECRET,
    });
    if (!signatureOk) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as unknown;
    const inboundMessages = extractInboundTextMessages(payload);
    if (inboundMessages.length === 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const internalToken = process.env.WHATSAPP_INTERNAL_TOKEN;
    if (!internalToken) {
      return NextResponse.json({ error: "Missing WHATSAPP_INTERNAL_TOKEN" }, { status: 500 });
    }

    const baseUrl = appBaseUrl(request);

    for (const inbound of inboundMessages) {
      try {
        const businessId = resolveBusinessIdForPhoneNumber(inbound.phoneNumberId);
        if (!businessId) continue;

        // Idempotency guard: skip if this inbound message ID is already saved.
        const already = await supabase
          .from("messages")
          .select("id")
          .eq("channel", "whatsapp")
          .eq("meta->>wa_message_id", inbound.messageId)
          .limit(1)
          .maybeSingle<{ id: string }>();
        if (already.data?.id) continue;

        const biz = await supabase
          .from("businesses")
          .select("billing_plan,billing_status,trial_end")
          .eq("id", businessId)
          .maybeSingle<{
            billing_plan: string | null;
            billing_status: "incomplete" | "trialing" | "active" | "canceled" | "past_due" | null;
            trial_end: string | null;
          }>();
        if (
          !biz.data ||
          !isGrowthOrHigher(
            effectivePlanForEntitlements({
              billingPlan: biz.data.billing_plan,
              billingStatus: biz.data.billing_status,
              trialEnd: biz.data.trial_end,
            })
          )
        ) {
          await sendWhatsAppText({
            phoneNumberId: inbound.phoneNumberId,
            to: inbound.fromWaId,
            text: "WhatsApp channel is not enabled for this account.",
          });
          continue;
        }

        const convRes = await fetch(`${baseUrl}/api/conversation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${internalToken}`,
          },
          body: JSON.stringify({
            businessId,
            channel: "whatsapp",
            externalRef: `wa:${inbound.fromWaId}`,
            customerName: inbound.profileName,
            message: inbound.text,
            meta: {
              wa_message_id: inbound.messageId,
              wa_phone_number_id: inbound.phoneNumberId,
              wa_from: inbound.fromWaId,
              wa_timestamp: inbound.timestamp,
            },
          }),
          cache: "no-store",
        });

        const convJson = (await convRes.json().catch(() => ({}))) as {
          reply?: string;
          error?: string;
        };
        if (!convRes.ok || !convJson.reply) {
          continue;
        }

        await sendWhatsAppText({
          phoneNumberId: inbound.phoneNumberId,
          to: inbound.fromWaId,
          text: convJson.reply,
        });
      } catch (err) {
        console.error("whatsapp message processing failed", err);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("whatsapp webhook fatal", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
