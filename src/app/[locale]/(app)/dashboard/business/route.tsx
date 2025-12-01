// src/app/api/settings/business/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfilePayload = {
  nombre_negocio?: string | null;
  nombre_contacto?: string | null;
  telefono?: string | null;
};
type BusinessPayload = {
  name?: string | null;
  timezone?: string | null;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const nonEmpty = (v: unknown) =>
  typeof v === "string" ? (v.trim().length > 0 ? v.trim() : null) : v ?? null;

export async function POST(req: Request) {
  try {
    const { userId, profile, business } = (await req.json()) as {
      userId?: string | null;
      profile?: ProfilePayload;
      business?: BusinessPayload;
    };

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400, headers: CORS });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Fetch current links/values
    const prof = await admin
      .from("business_profiles")
      .select("id, business_id, nombre_negocio, nombre_contacto, telefono, email")
      .eq("id", userId)
      .single();

    if (prof.error || !prof.data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404, headers: CORS });
    }

    const businessId = prof.data.business_id;
    if (!businessId) {
      return NextResponse.json({ error: "No business linked to profile" }, { status: 400, headers: CORS });
    }

    // Merge-only fields for profile
    const nextProfile: Record<string, unknown> = {};
    if (profile) {
      const nn = nonEmpty(profile.nombre_negocio);
      const nc = nonEmpty(profile.nombre_contacto);
      const tel = nonEmpty(profile.telefono);

      if (nn) nextProfile.nombre_negocio = nn;
      if (nc) nextProfile.nombre_contacto = nc;
      if (tel) nextProfile.telefono = tel;
      if (Object.keys(nextProfile).length > 0) {
        nextProfile.updated_at = new Date().toISOString();
        const up = await admin
          .from("business_profiles")
          .update(nextProfile)
          .eq("id", userId);
        if (up.error) {
          return NextResponse.json({ error: up.error.message }, { status: 400, headers: CORS });
        }
      }
    }

    // Merge-only fields for business
    const nextBusiness: Record<string, unknown> = {};
    if (business) {
      const name = nonEmpty(business.name);
      const tz = nonEmpty(business.timezone);

      if (name) nextBusiness.name = name;
      if (tz) nextBusiness.timezone = tz;

      if (Object.keys(nextBusiness).length > 0) {
        const upb = await admin
          .from("businesses")
          .update(nextBusiness)
          .eq("id", businessId);
        if (upb.error) {
          return NextResponse.json({ error: upb.error.message }, { status: 400, headers: CORS });
        }
      }
    }

    // Return current state after update
    const bNow = await admin
      .from("businesses")
      .select("id, slug, name, timezone")
      .eq("id", businessId)
      .single();

    return NextResponse.json(
      {
        ok: true,
        business: bNow.data ?? null,
      },
      { status: 200, headers: CORS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS });
  }
}
