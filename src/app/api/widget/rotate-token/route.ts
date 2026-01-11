import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminFromTable } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

function getBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function POST(req: NextRequest) {
  try {
    const tokenJwt = getBearer(req);
    if (!tokenJwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${tokenJwt}` } } }
    );

    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser();
    const userId = userRes?.user?.id ?? null;
    if (userErr || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: prof, error: profErr } = await adminFromTable("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single();

    if (profErr || !prof?.business_id) {
      return NextResponse.json({ error: "Business not linked" }, { status: 400 });
    }

    const newToken = crypto.randomBytes(24).toString("hex");
    const { error } = await adminFromTable("embed_tokens")
      .insert({ business_id: prof.business_id, token: newToken });

    if (error) throw error;

    return NextResponse.json({ token: newToken });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
