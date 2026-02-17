import { NextResponse } from "next/server";
import { headers } from "next/headers";
import * as crypto from "crypto";

export const runtime = "nodejs";

const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com";
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE || "";

/** Helper to hash PII data (REQUIRED by Meta) */
function hashSHA256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function cleanIp(xff: string | null): string {
  if (!xff) return "";
  return xff.split(",")[0]?.trim() || "";
}

type MetaEventPayload = {
  event_name: string;
  event_id?: string;
  event_source_url?: string;

  email?: string;
  phone?: string;

  fbc?: string;
  fbp?: string;

  business_id?: string;
  plan?: "basic" | "growth" | "pro" | "custom" | "starter";

  value?: number;
  currency?: string;

  custom_data?: Record<string, unknown>;
};

type MetaUserData = {
  em?: string[];
  ph?: string[];
  fbc?: string;
  fbp?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  [key: string]: unknown;
};

type MetaCapiEvent = {
  event_name: string;
  event_time: number;
  event_source_url: string;
  action_source: "website";
  event_id?: string;
  user_data: MetaUserData;
  custom_data?: Record<string, unknown>;
};

type MetaCapiPayload = {
  data: MetaCapiEvent[];
  test_event_code?: string;
};

export async function POST(request: Request) {
  if (!ACCESS_TOKEN || !PIXEL_ID) {
    return NextResponse.json(
      { success: false, error: "Meta CAPI not configured (missing META_CAPI_ACCESS_TOKEN or NEXT_PUBLIC_META_PIXEL_ID)" },
      { status: 500 }
    );
  }

  let payload: MetaEventPayload;
  try {
    payload = (await request.json()) as MetaEventPayload;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.event_name) {
    return NextResponse.json({ success: false, error: "Missing event_name" }, { status: 400 });
  }

  const h = await headers();
  const clientIp = cleanIp(h.get("x-forwarded-for")) || h.get("x-real-ip") || "";
  const clientUserAgent = h.get("user-agent") || "";
  const referer = h.get("referer") || "";

  const eventSourceUrl = payload.event_source_url || referer || SITE_URL;

  const user_data: MetaUserData = {
    client_ip_address: clientIp,
    client_user_agent: clientUserAgent,
  };

  if (payload.email) user_data.em = [hashSHA256(payload.email)];
  if (payload.phone) user_data.ph = [hashSHA256(payload.phone)];
  if (payload.fbc) user_data.fbc = payload.fbc;
  if (payload.fbp) user_data.fbp = payload.fbp;

  const custom_data: Record<string, unknown> = {
    ...(payload.currency ? { currency: payload.currency } : {}),
    ...(typeof payload.value === "number" ? { value: payload.value } : {}),
    ...(payload.plan ? { aliigo_plan: payload.plan } : {}),
    ...(payload.business_id ? { aliigo_business_id: payload.business_id } : {}),
    ...(payload.custom_data || {}),
  };

  const event: MetaCapiEvent = {
    event_name: payload.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: eventSourceUrl,
    action_source: "website",
    ...(payload.event_id ? { event_id: payload.event_id } : {}),
    user_data,
    ...(Object.keys(custom_data).length ? { custom_data } : {}),
  };

  const eventData: MetaCapiPayload = { data: [event] };
  if (TEST_EVENT_CODE) eventData.test_event_code = TEST_EVENT_CODE;

  const metaResponse = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    }
  );

  const metaResult = await metaResponse.json().catch(() => ({}));

  if (!metaResponse.ok) {
    return NextResponse.json({ success: false, error: metaResult }, { status: 500 });
  }

  return NextResponse.json({ success: true, metaResponse: metaResult });
}
