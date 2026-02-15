import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buildVerificationEmail,
  createVerificationToken,
  getAppUrl,
} from "@/lib/emailVerification";

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
