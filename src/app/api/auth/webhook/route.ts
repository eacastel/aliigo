import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { buildWelcomeEmail, normalizeLocale } from "@/emails/auth/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthEventPayload = {
  type: string;
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown> | null;
  };
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getHookSecret() {
  const raw = requireEnv("AUTH_WEBHOOK_SECRET");
  return raw
    .replace("v1,whsec_", "")
    .replace("whsec_", "")
    .replace("v1,", "");
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

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    const wh = new Webhook(getHookSecret());
    const verified = wh.verify(payload, headers) as AuthEventPayload;

    if (verified.type !== "user.confirmed") {
      return json({ ok: true });
    }

    const meta = verified.user.user_metadata ?? {};
    const locale = normalizeLocale(
      typeof meta.locale === "string" ? meta.locale : null
    );
    const fullName =
      typeof meta.full_name === "string" ? meta.full_name : null;

    const dashboardUrl =
      locale === "es"
        ? "https://aliigo.com/es/dashboard"
        : "https://aliigo.com/en/dashboard";

    const welcome = buildWelcomeEmail({
      email: verified.user.email,
      fullName,
      locale,
      dashboardUrl,
    });

    await sendResendEmail({
      to: verified.user.email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
    });

    return json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ ok: false, error: msg }, 400);
  }
}
