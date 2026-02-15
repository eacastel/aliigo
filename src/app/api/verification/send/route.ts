import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createVerificationToken, getAppUrl } from "@/lib/emailVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Purpose = "signup" | "email_change";

function normalizeLocale(v: unknown): "en" | "es" {
  return v === "es" ? "es" : "en";
}

function normalizeEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  if (!e || !e.includes("@")) return null;
  return e;
}

async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Missing Resend env");

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

function buildVerificationEmail(opts: {
  locale: "en" | "es";
  purpose: Purpose;
  email: string;
  verifyUrl: string;
}) {
  const isEs = opts.locale === "es";
  const title =
    opts.purpose === "email_change"
      ? isEs
        ? "Confirma tu nuevo email"
        : "Confirm your new email"
      : isEs
      ? "Confirma tu email"
      : "Confirm your email";
  const body =
    opts.purpose === "email_change"
      ? isEs
        ? "Haz clic en el botón para confirmar el cambio de email en tu cuenta de Aliigo."
        : "Click the button to confirm the email change on your Aliigo account."
      : isEs
      ? "Haz clic en el botón para verificar tu email y mantener activa tu cuenta."
      : "Click the button to verify your email and keep your account active.";

  const button = isEs ? "Verificar email" : "Verify email";
  const subject =
    opts.purpose === "email_change"
      ? isEs
        ? "Aliigo: confirma tu nuevo email"
        : "Aliigo: confirm your new email"
      : isEs
      ? "Aliigo: confirma tu email"
      : "Aliigo: confirm your email";

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111; background:#fff;">
      <div style="max-width:560px; margin:0 auto; padding:24px;">
        <h2 style="margin:0 0 10px;">${title}</h2>
        <p style="margin:0 0 16px; color:#333; font-size:14px;">${body}</p>
        <p style="margin:0 0 16px;">
          <a href="${opts.verifyUrl}" style="display:inline-block; padding:10px 16px; background:#84C9AD; color:#0b0b0b; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">
            ${button}
          </a>
        </p>
        <p style="font-size:12px; color:#666; margin-top:16px;">${opts.verifyUrl}</p>
      </div>
    </div>
  `;

  const text = [title, body, opts.verifyUrl].join("\n");
  return { subject, html, text };
}

export async function POST(req: Request) {
  try {
    const { userId, email: sessionEmail } = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const purpose = body.purpose === "email_change" ? "email_change" : "signup";
    const locale = normalizeLocale(body.locale);

    const targetEmail =
      purpose === "email_change"
        ? normalizeEmail(body.email)
        : normalizeEmail(sessionEmail);

    if (!targetEmail) {
      return NextResponse.json({ ok: false, error: "Missing email." }, { status: 400 });
    }

    if (purpose === "signup") {
      await supabaseAdmin
        .from("business_profiles")
        .update({
          email_verification_deadline: new Date(
            Date.now() + 72 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("id", userId);
    }

    // Invalidate previous active token for same purpose.
    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("purpose", purpose)
      .is("used_at", null);

    const { token, tokenHash } = createVerificationToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const { error: tokenErr } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        user_id: userId,
        purpose,
        email: targetEmail,
        token_hash: tokenHash,
        expires_at: expiresAt,
        meta: purpose === "email_change" ? { pending_email: targetEmail } : {},
      });

    if (tokenErr) {
      return NextResponse.json({ ok: false, error: tokenErr.message }, { status: 500 });
    }

    const verifyUrl = `${getAppUrl()}/${locale}/verify-email?token=${encodeURIComponent(token)}`;
    const emailPayload = buildVerificationEmail({
      locale,
      purpose,
      email: targetEmail,
      verifyUrl,
    });

    await sendResendEmail({
      to: targetEmail,
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

