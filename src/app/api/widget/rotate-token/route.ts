import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import type { BusinessProfileRow } from "@/types/tables";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = (await req.json()) as { userId: string };

    const { data: prof, error: profErr } = await admin
      .from<BusinessProfileRow>("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single();

    if (profErr || !prof?.business_id) {
      return NextResponse.json({ error: "Business not linked" }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const { error } = await admin
      .from("embed_tokens")
      .insert({ business_id: prof.business_id, token });

    if (error) throw error;

    return NextResponse.json({ token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
