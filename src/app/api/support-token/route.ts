import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Find aliigo business
  const { data: biz, error: bizErr } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("slug", "aliigo")
    .single();

  if (bizErr || !biz?.id) {
    return NextResponse.json({ error: "Aliigo business not found" }, { status: 404 });
  }

  // Latest token
  const { data: tok } = await supabaseAdmin
    .from("embed_tokens")
    .select("token")
    .eq("business_id", biz.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ token: tok?.token ?? null });
}
