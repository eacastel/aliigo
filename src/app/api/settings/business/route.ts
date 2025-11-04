// src/app/api/settings/business/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFromTable } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { userId, profile, business } = (await req.json()) as {
      userId: string;
      profile?: { nombre_negocio?: string; nombre_contacto?: string; telefono?: string };
      business?: { name?: string; timezone?: string };
    };

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Update profile
    if (profile) {
      const { error } = await adminFromTable("business_profiles")
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
    const { data: prof, error: profErr } = await adminFromTable("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single();

    if (profErr || !prof?.business_id) {
      return NextResponse.json({ error: "Business not linked" }, { status: 400 });
    }

    // Update business
    // Update business
    if (business) {
      const { error } = await adminFromTable("businesses")
        .update({
          name: business.name,
          timezone: business.timezone,
        })
        .eq("id", prof.business_id);
      if (error) throw error;
    }

    // Return the current business row so the client can refresh its snapshot
    const { data: currentBiz, error: readErr } = await adminFromTable("businesses")
      .select("name, timezone")
      .eq("id", prof.business_id)
      .single();

    if (readErr) throw readErr;

    return NextResponse.json({ ok: true, business: currentBiz });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
