// app/api/widget/rotate-token/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminFromTable } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { userId } = (await req.json()) as { userId: string };
    const { data: prof, error: profErr } = await adminFromTable("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single();
    if (profErr || !prof?.business_id) {
      return NextResponse.json({ error: "Business not linked" }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const { error } = await adminFromTable("embed_tokens")
      .insert({ business_id: prof.business_id, token });
    if (error) throw error;

    return NextResponse.json({ token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
