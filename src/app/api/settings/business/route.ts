// src/app/api/settings/business/route.ts
import { NextRequest, NextResponse } from "next/server";
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
  system_prompt?: string | null;
  knowledge?: string | null;
  allowed_domains?: string[] | null;
};

const nonEmpty = (v: unknown) =>
  typeof v === "string" ? (v.trim().length > 0 ? v.trim() : null) : v ?? null;

function normalizeDomains(domains: unknown): string[] | null {
  if (!Array.isArray(domains)) return null;
  const cleaned = domains
    .map((d) => (typeof d === "string" ? d.trim().toLowerCase() : ""))
    .filter(Boolean);
  // unique
  return Array.from(new Set(cleaned));
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1) Verify the user with the bearer token (anon client)
    const authed = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await authed.auth.getUser();
    const userId = userRes?.user?.id;

    if (userErr || !userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 2) Admin client for DB writes (service role)
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const body = (await req.json()) as {
      profile?: ProfilePayload;
      business?: BusinessPayload;
    };

    // 3) Resolve business_id from business_profiles
    const { data: prof, error: profErr } = await admin
      .from("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single<{ business_id: string | null }>();

    if (profErr || !prof?.business_id) {
      return NextResponse.json({ error: "Business not linked to profile" }, { status: 400 });
    }

    const businessId = prof.business_id;

    // 4) Update profile (merge-only)
    if (body.profile) {
      const nextProfile: Record<string, unknown> = {};
      const nn = nonEmpty(body.profile.nombre_negocio);
      const nc = nonEmpty(body.profile.nombre_contacto);
      const tel = nonEmpty(body.profile.telefono);

      if (nn !== null && nn !== undefined) nextProfile.nombre_negocio = nn;
      if (nc !== null && nc !== undefined) nextProfile.nombre_contacto = nc;
      if (tel !== null && tel !== undefined) nextProfile.telefono = tel;

      if (Object.keys(nextProfile).length > 0) {
        nextProfile.updated_at = new Date().toISOString();
        const { error } = await admin
          .from("business_profiles")
          .update(nextProfile)
          .eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // 5) Update business (merge-only)
    if (body.business) {
      const nextBiz: Record<string, unknown> = {};
      const name = nonEmpty(body.business.name);
      const tz = nonEmpty(body.business.timezone);
      const sp = body.business.system_prompt ?? undefined;
      const knowledge = body.business.knowledge ?? undefined;
      const domains = normalizeDomains(body.business.allowed_domains);

      if (name !== null && name !== undefined) nextBiz.name = name;
      if (tz !== null && tz !== undefined) nextBiz.timezone = tz;
      if (sp !== undefined) nextBiz.system_prompt = nonEmpty(sp);
      if (knowledge !== undefined) nextBiz.knowledge = nonEmpty(knowledge);
      if (domains !== null) nextBiz.allowed_domains = domains;

      if (Object.keys(nextBiz).length > 0) {
        const { error } = await admin
          .from("businesses")
          .update(nextBiz)
          .eq("id", businessId);

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // 6) Return current business row
    const { data: currentBiz, error: readErr } = await admin
      .from("businesses")
      .select("id, slug, name, timezone, system_prompt, knowledge, allowed_domains, public_embed_key")
      .eq("id", businessId)
      .single();

    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, business: currentBiz }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
