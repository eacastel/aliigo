import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type ProInquiryPayload = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  message?: string;
  locale?: string;
  source?: string;
  page_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  honeypot?: string;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function normalize(input?: string) {
  const v = (input || "").trim();
  return v.length ? v : null;
}

function isValidEmail(email: string | null) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ProInquiryPayload;

    if (normalize(body.honeypot)) {
      return json({ ok: true });
    }

    const name = normalize(body.name);
    const email = normalize(body.email);
    const company = normalize(body.company);

    if (!name || !email || !company || !isValidEmail(email)) {
      return json({ ok: false, error: "invalid_input" }, 400);
    }

    const insertPayload = {
      name,
      email,
      phone: normalize(body.phone),
      company,
      website: normalize(body.website),
      message: normalize(body.message),
      locale: normalize(body.locale),
      source: normalize(body.source),
      page_url: normalize(body.page_url),
      utm_source: normalize(body.utm_source),
      utm_medium: normalize(body.utm_medium),
      utm_campaign: normalize(body.utm_campaign),
      utm_content: normalize(body.utm_content),
      utm_term: normalize(body.utm_term),
    };

    const { error } = await supabaseAdmin.from("pro_inquiries").insert(insertPayload);

    if (error) {
      return json({ ok: false, error: "supabase_error", details: error.message }, 500);
    }

    return json({ ok: true }, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ ok: false, error: msg }, 500);
  }
}
