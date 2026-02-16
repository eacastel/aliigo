import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import {
  buildVerificationEmail,
  createVerificationToken,
  getAppUrl,
} from "@/lib/emailVerification";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    const { userId, email: currentEmail } = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const locale = normalizeLocale(body.locale);
    const targetEmail = normalizeEmail(body.email);

    if (!targetEmail) {
      return NextResponse.json(
        { ok: false, error: "Missing target email." },
        { status: 400 }
      );
    }

    const current = normalizeEmail(currentEmail);
    if (current && current === targetEmail) {
      return NextResponse.json(
        { ok: false, error: "Email is unchanged." },
        { status: 400 }
      );
    }

    // Prevent collisions with an existing business profile email.
    const { data: existingProfile, error: existingErr } = await supabaseAdmin
      .from("business_profiles")
      .select("id")
      .eq("email", targetEmail)
      .neq("id", userId)
      .maybeSingle<{ id: string }>();

    if (existingErr) {
      return NextResponse.json(
        { ok: false, error: existingErr.message },
        { status: 500 }
      );
    }
    if (existingProfile?.id) {
      return NextResponse.json(
        { ok: false, error: "Email already in use." },
        { status: 409 }
      );
    }

    // Invalidate active email-change tokens.
    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("purpose", "email_change")
      .is("used_at", null);

    const { token, tokenHash } = createVerificationToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const { error: tokenErr } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        user_id: userId,
        purpose: "email_change",
        email: targetEmail,
        token_hash: tokenHash,
        expires_at: expiresAt,
        meta: { pending_email: targetEmail },
      });

    if (tokenErr) {
      return NextResponse.json(
        { ok: false, error: tokenErr.message },
        { status: 500 }
      );
    }

    const verifyUrl = `${getAppUrl()}/${locale}/verify-email?token=${encodeURIComponent(
      token
    )}`;

    const emailPayload = buildVerificationEmail({
      locale,
      purpose: "email_change",
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

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);

    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("email, expires_at")
      .eq("user_id", userId)
      .eq("purpose", "email_change")
      .is("used_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ email: string; expires_at: string }>();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      pendingEmail: data?.email ?? null,
      expiresAt: data?.expires_at ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
