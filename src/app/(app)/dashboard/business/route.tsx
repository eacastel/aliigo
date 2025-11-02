import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : v;
}
function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const { userId, profile, business } = (await req.json()) ?? {};
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400, headers: CORS });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

    // Find the linked business_id for this user
    const profRes = await admin
      .from("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single();

    const businessId = profRes.data?.business_id as string | undefined;
    if (!businessId) {
      return NextResponse.json(
        { error: "No linked business for this user." },
        { status: 400, headers: CORS }
      );
    }

    // Fetch current rows to merge safely
    const [curBiz, curProf] = await Promise.all([
      admin.from("businesses").select("id,name,timezone").eq("id", businessId).single(),
      admin.from("business_profiles").select("id,nombre_negocio,nombre_contacto,telefono,email").eq("id", userId).single(),
    ]);

    if (curBiz.error || !curBiz.data) {
      return NextResponse.json({ error: "Business not found." }, { status: 404, headers: CORS });
    }
    if (curProf.error || !curProf.data) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404, headers: CORS });
    }

    // Build merged updates — ignore empty strings so we never wipe values by accident
    const nextProfile = {
      nombre_negocio: nonEmpty(clean(profile?.nombre_negocio))
        ? clean(profile.nombre_negocio)
        : curProf.data.nombre_negocio,
      nombre_contacto: nonEmpty(clean(profile?.nombre_contacto))
        ? clean(profile.nombre_contacto)
        : curProf.data.nombre_contacto,
      telefono: nonEmpty(clean(profile?.telefono))
        ? clean(profile.telefono)
        : curProf.data.telefono,
      email: nonEmpty(clean(profile?.email))
        ? clean(profile.email)
        : curProf.data.email,
      updated_at: new Date().toISOString(),
    };

    const nextBusiness = {
      name: nonEmpty(clean(business?.name))
        ? clean(business.name)
        : curBiz.data.name,
      timezone: nonEmpty(clean(business?.timezone))
        ? clean(business.timezone)
        : curBiz.data.timezone ?? "Europe/Madrid",
    };

    // Guard: ensure we never set business name to empty
    if (!nonEmpty(nextBusiness.name)) {
      return NextResponse.json(
        { error: "Business name cannot be empty." },
        { status: 400, headers: CORS }
      );
    }

    // Apply updates (service role bypasses RLS, but we’re scoping by ids)
    const [u1, u2] = await Promise.all([
      admin.from("business_profiles").update(nextProfile).eq("id", userId),
      admin.from("businesses").update(nextBusiness).eq("id", businessId),
    ]);
    if (u1.error) return NextResponse.json({ error: u1.error.message }, { status: 400, headers: CORS });
    if (u2.error) return NextResponse.json({ error: u2.error.message }, { status: 400, headers: CORS });

    return NextResponse.json({ ok: true }, { status: 200, headers: CORS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS });
  }
}
