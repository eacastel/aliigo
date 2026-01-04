// src/app/api/settings/business/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfilePayload = { nombre_negocio?: string | null; nombre_contacto?: string | null; telefono?: string | null; };
type BusinessPayload = { name?: string | null; timezone?: string | null; system_prompt?: string | null; knowledge?: string | null; allowed_domains?: string[] | null; };

function corsHeadersFor(req: NextRequest): HeadersInit {
  const origin = req.headers.get("origin") || "";
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (!origin) return base;
  return { ...base, "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeadersFor(req) });
}

const nonEmpty = (v: unknown) =>
  typeof v === "string" ? (v.trim().length > 0 ? v.trim() : null) : v ?? null;

export async function POST(req: NextRequest) {
  const headers = corsHeadersFor(req);

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1) Verify user from JWT (NO trusting body)
    const authHeader = req.headers.get("authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) return NextResponse.json({ error: "Missing auth" }, { status: 401, headers });

    const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: userRes, error: userErr } = await authClient.auth.getUser(jwt);
    const user = userRes?.user;
    if (userErr || !user) return NextResponse.json({ error: "Invalid auth" }, { status: 401, headers });

    const userId = user.id;

    const { profile, business } = (await req.json()) as {
      profile?: ProfilePayload;
      business?: BusinessPayload;
    };

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Fetch profile + linked business for THIS user
    const prof = await admin
      .from("business_profiles")
      .select("id, business_id")
      .eq("id", userId)
      .single();

    if (prof.error || !prof.data) return NextResponse.json({ error: "Profile not found" }, { status: 404, headers });

    const businessId = prof.data.business_id;
    if (!businessId) return NextResponse.json({ error: "No business linked to profile" }, { status: 400, headers });

    // Update profile (merge)
    if (profile) {
      const nextProfile: Record<string, unknown> = {};
      const nn = nonEmpty(profile.nombre_negocio);
      const nc = nonEmpty(profile.nombre_contacto);
      const tel = nonEmpty(profile.telefono);
      if (nn) nextProfile.nombre_negocio = nn;
      if (nc) nextProfile.nombre_contacto = nc;
      if (tel) nextProfile.telefono = tel;

      if (Object.keys(nextProfile).length > 0) {
        nextProfile.updated_at = new Date().toISOString();
        const up = await admin.from("business_profiles").update(nextProfile).eq("id", userId);
        if (up.error) return NextResponse.json({ error: up.error.message }, { status: 400, headers });
      }
    }

    // Update business (merge)
    if (business) {
      const nextBusiness: Record<string, unknown> = {};
      const name = nonEmpty(business.name);
      const tz = nonEmpty(business.timezone);
      const sp = nonEmpty(business.system_prompt);
      const kn = nonEmpty(business.knowledge);

      if (name) nextBusiness.name = name;
      if (tz) nextBusiness.timezone = tz;
      if (sp !== undefined) nextBusiness.system_prompt = sp; // allow clearing to null
      if (kn !== undefined) nextBusiness.knowledge = kn;

      if (Array.isArray(business.allowed_domains)) nextBusiness.allowed_domains = business.allowed_domains;

      if (Object.keys(nextBusiness).length > 0) {
        const upb = await admin.from("businesses").update(nextBusiness).eq("id", businessId);
        if (upb.error) return NextResponse.json({ error: upb.error.message }, { status: 400, headers });
      }
    }

    const bNow = await admin
      .from("businesses")
      .select("id, slug, name, timezone, system_prompt, knowledge, allowed_domains")
      .eq("id", businessId)
      .single();

    return NextResponse.json({ ok: true, business: bNow.data ?? null }, { status: 200, headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
