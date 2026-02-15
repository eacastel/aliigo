import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashVerificationToken } from "@/lib/emailVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
    }

    const tokenHash = hashVerificationToken(token);

    const { data: row, error } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("id, user_id, purpose, email, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle<{
        id: string;
        user_id: string;
        purpose: "signup" | "email_change";
        email: string;
        expires_at: string;
        used_at: string | null;
      }>();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ ok: false, error: "Invalid token." }, { status: 400 });
    }
    if (row.used_at) {
      return NextResponse.json({ ok: false, error: "Token already used." }, { status: 400 });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "Token expired." }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    if (row.purpose === "email_change") {
      const { error: updAuthErr } = await supabaseAdmin.auth.admin.updateUserById(
        row.user_id,
        {
          email: row.email,
          email_confirm: true,
        }
      );
      if (updAuthErr) {
        return NextResponse.json({ ok: false, error: updAuthErr.message }, { status: 400 });
      }
    }

    const { error: profileErr } = await supabaseAdmin
      .from("business_profiles")
      .update({
        email_verified_at: nowIso,
        ...(row.purpose === "email_change" ? { email: row.email } : {}),
      })
      .eq("id", row.user_id);

    if (profileErr) {
      return NextResponse.json({ ok: false, error: profileErr.message }, { status: 500 });
    }

    const { error: markErr } = await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used_at: nowIso })
      .eq("id", row.id);

    if (markErr) {
      return NextResponse.json({ ok: false, error: markErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, purpose: row.purpose, email: row.email });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

