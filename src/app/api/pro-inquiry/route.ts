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

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function sendResendEmail(payload: {
  name: string | null;
  email: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  message: string | null;
  page_url: string | null;
  locale: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");
  const to = requireEnv("RESEND_TO_EMAIL");
  const replyTo = payload.email ?? undefined;

  const subject = `New Aliigo Pro inquiry${payload.company ? ` — ${payload.company}` : ""}`;
  const lines = [
    `Name: ${payload.name ?? "-"}`,
    `Email: ${payload.email ?? "-"}`,
    `Company: ${payload.company ?? "-"}`,
    `Phone: ${payload.phone ?? "-"}`,
    `Website: ${payload.website ?? "-"}`,
    `Locale: ${payload.locale ?? "-"}`,
    `Page: ${payload.page_url ?? "-"}`,
    `Message: ${payload.message ?? "-"}`,
    "",
    "UTM:",
    `  source: ${payload.utm_source ?? "-"}`,
    `  medium: ${payload.utm_medium ?? "-"}`,
    `  campaign: ${payload.utm_campaign ?? "-"}`,
    `  content: ${payload.utm_content ?? "-"}`,
    `  term: ${payload.utm_term ?? "-"}`,
  ];

  const text = lines.join("\n");
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111;">
      <h2 style="margin:0 0 12px;">New Aliigo Pro inquiry</h2>
      <table style="border-collapse:collapse; width:100%; font-size:14px;">
        <tr><td style="padding:6px 0; color:#555;">Name</td><td style="padding:6px 0;">${payload.name ?? "-"}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Email</td><td style="padding:6px 0;">${payload.email ?? "-"}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Company</td><td style="padding:6px 0;">${payload.company ?? "-"}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Phone</td><td style="padding:6px 0;">${payload.phone ?? "-"}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Website</td><td style="padding:6px 0;">${payload.website ?? "-"}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Locale</td><td style="padding:6px 0;">${payload.locale ?? "-"}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Page</td><td style="padding:6px 0;">${payload.page_url ?? "-"}</td></tr>
      </table>
      <div style="margin:16px 0; padding:12px; background:#f7f7f7; border-radius:8px;">
        <div style="color:#555; font-size:12px; margin-bottom:6px;">Message</div>
        <div style="white-space:pre-wrap;">${payload.message ?? "-"}</div>
      </div>
      <div style="font-size:12px; color:#666;">
        <div>UTM source: ${payload.utm_source ?? "-"}</div>
        <div>UTM medium: ${payload.utm_medium ?? "-"}</div>
        <div>UTM campaign: ${payload.utm_campaign ?? "-"}</div>
        <div>UTM content: ${payload.utm_content ?? "-"}</div>
        <div>UTM term: ${payload.utm_term ?? "-"}</div>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${details}`);
  }
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

    try {
      await sendResendEmail(insertPayload);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Email error";
      return json({ ok: false, error: "email_error", details: msg }, 500);
    }

    return json({ ok: true }, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ ok: false, error: msg }, 500);
  }
}
