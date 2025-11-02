import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BusinessProfileRow } from "@/types/tables";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, profile, business } = (await req.json()) as {
      userId: string;
      profile: { nombre_negocio?: string; nombre_contacto?: string; telefono?: string };
      business: { name?: string; timezone?: string };
    };

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Update profile
    if (profile) {
      const { error } = await admin
        .from("business_profiles")
        .update({
          nombre_negocio: profile.nombre_negocio,
          nombre_contacto: profile.nombre_contacto,
          telefono: profile.telefono,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) throw error;
    }

    // Resolve business_id
    const { data: prof, error: profErr } = await admin
      .from<BusinessProfileRow>("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single();

    if (profErr || !prof?.business_id) {
      return NextResponse.json({ error: "Business not linked" }, { status: 400 });
    }

    // Update business
    if (business) {
      const { error } = await admin
        .from("businesses")
        .update({
          name: business.name,
          timezone: business.timezone,
        })
        .eq("id", prof.business_id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
