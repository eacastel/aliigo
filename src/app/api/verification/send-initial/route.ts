import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createVerificationToken, getAppUrl } from "@/lib/emailVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  verifyUrl: string;
}) {
  const isEs = opts.locale === "es";
  const title = isEs ? "Confirma tu email" : "Confirm your email";
  const body = isEs
    ? "Haz clic en el botón para verificar tu email y mantener activa tu cuenta."
    : "Click the button to verify your email and keep your account active.";
  const button = isEs ? "Verificar email" : "Verify email";
  const subject = isEs ? "Aliigo: confirma tu email" : "Aliigo: confirm your email";

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
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const email = normalizeEmail(body.email);
    const locale = normalizeLocale(body.locale);

    if (!userId || !email) {
      return NextResponse.json({ ok: false, error: "Missing userId/email." }, { status: 400 });
    }

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authErr || !authUser.user || (authUser.user.email ?? "").toLowerCase() !== email) {
      return NextResponse.json({ ok: false, error: "Invalid user/email pair." }, { status: 400 });
    }

    const createdAtMs = new Date(authUser.user.created_at ?? 0).getTime();
    if (!createdAtMs || Date.now() - createdAtMs > 15 * 60 * 1000) {
      return NextResponse.json({ ok: false, error: "Signup window expired." }, { status: 400 });
    }

    await supabaseAdmin
      .from("business_profiles")
      .update({
        email_verification_deadline: new Date(
          Date.now() + 72 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq("id", userId);

    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("purpose", "signup")
      .is("used_at", null);

    const { token, tokenHash } = createVerificationToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const { error: tokenErr } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        user_id: userId,
        purpose: "signup",
        email,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (tokenErr) {
      return NextResponse.json({ ok: false, error: tokenErr.message }, { status: 500 });
    }

    const verifyUrl = `${getAppUrl()}/${locale}/verify-email?token=${encodeURIComponent(token)}`;
    const emailPayload = buildVerificationEmail({ locale, verifyUrl });
    await sendResendEmail({
      to: email,
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

