import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buildVerificationEmail,
  createVerificationToken,
  getAppUrl,
} from "@/lib/emailVerification";

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
    const emailPayload = buildVerificationEmail({
      locale,
      purpose: "signup",
      verifyUrl,
    });
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
