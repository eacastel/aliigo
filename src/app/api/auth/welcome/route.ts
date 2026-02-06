import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireUser } from "@/lib/server/auth";
import { buildWelcomeEmail, normalizeLocale } from "@/emails/auth/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");
  const res = await fetch("https://api.resend.com/emails", {
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

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${details}`);
  }
}

async function logEmailAudit(entry: {
  email: string;
  event: string;
  locale?: string | null;
  source?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  try {
    await supabaseAdmin.from("email_audit").insert({
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

export async function POST(req: Request) {
  try {
    const { userId, email } = await requireUser(req);
    if (!email) return json({ ok: false, error: "Missing email" }, 400);

    const body = await req.json().catch(() => ({}));
    const localeInput = typeof body?.locale === "string" ? body.locale : null;

    // Load user metadata for name/locale
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const meta = authUser?.user?.user_metadata ?? {};
    const locale = normalizeLocale(
      typeof meta.locale === "string" ? meta.locale : localeInput
    );
    const fullName = typeof meta.full_name === "string" ? meta.full_name : null;

    // Avoid duplicate welcome emails
    const { data: profile } = await supabaseAdmin
      .from("business_profiles")
      .select("welcome_email_sent_at")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.welcome_email_sent_at) {
      await logEmailAudit({
        email,
        event: "welcome_skipped",
        locale,
        source: "auth_callback",
        payload: { user_id: userId },
      });
      return json({ ok: true });
    }

    const dashboardUrl =
      locale === "es"
        ? "https://aliigo.com/es/dashboard"
        : "https://aliigo.com/en/dashboard";

    const welcome = buildWelcomeEmail({
      email,
      fullName,
      locale,
      dashboardUrl,
    });

    await sendResendEmail({
      to: email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
    });

    await supabaseAdmin
      .from("business_profiles")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", userId);

    await logEmailAudit({
      email,
      event: "welcome_sent",
      locale,
      source: "auth_callback",
      payload: { user_id: userId },
    });

    return json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ ok: false, error: msg }, 400);
  }
}
