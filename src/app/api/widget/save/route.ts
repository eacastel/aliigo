// app/api/widget/save/route.ts


import { NextRequest, NextResponse } from "next/server";
import { adminFromTable } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { userId, allowed_domains, system_prompt } = (await req.json()) as {
      userId: string;
      allowed_domains: string[];
      system_prompt: string;
    };

    const { data: prof, error: profErr } = await adminFromTable("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single();
    if (profErr || !prof?.business_id) {
      return NextResponse.json({ error: "Business not linked" }, { status: 400 });
    }

    const { error } = await adminFromTable("businesses")
      .update({ allowed_domains, system_prompt })
      .eq("id", prof.business_id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
