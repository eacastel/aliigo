import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("x-cron-secret");
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";

  const authorized =
    !!secret && ((header && header === secret) || (bearer && bearer === secret));

  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("business_profiles")
    .select("id, email, email_verification_deadline, email_verified_at")
    .is("email_verified_at", null)
    .not("email_verification_deadline", "is", null)
    .lt("email_verification_deadline", nowIso)
    .limit(100);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const targets = (data ?? []) as Array<{
    id: string;
    email: string | null;
    email_verification_deadline: string | null;
    email_verified_at: string | null;
  }>;

  let deleted = 0;
  const failed: Array<{ userId: string; error: string }> = [];

  for (const row of targets) {
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(row.id, false);
    if (delErr) {
      failed.push({ userId: row.id, error: delErr.message });
      continue;
    }
    deleted += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: targets.length,
    deleted,
    failed,
  });
}
