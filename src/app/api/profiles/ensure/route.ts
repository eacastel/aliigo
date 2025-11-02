// src/app/api/profiles/ensure/route.ts
import { NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

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

const looksLikeUUID = (v: unknown) =>
  typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);

function toSlug(name: string, fallback: string) {
  const base = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback;
}

export async function POST(req: Request) {
  const startedAt = new Date().toISOString();

  try {
    const body = await req.json().catch(() => ({}));
    const {
      id,
      nombre_negocio,
      nombre_contacto = null,
      telefono = null,
      email = null,
    } = body ?? {};

    // Basic input guard
    if (!id || !looksLikeUUID(id) || !nombre_negocio) {
      return NextResponse.json(
        { ok: false, where: "input", error: "Missing/invalid fields: id(uuid), nombre_negocio", body },
        { status: 400, headers: CORS }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, where: "env", error: "Missing SUPABASE env (URL or SERVICE_ROLE_KEY)" },
        { status: 500, headers: CORS }
      );
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 1) Ensure business
    const rawName = String(nombre_negocio).trim() || "Negocio";
    const slug = toSlug(rawName, `biz-${String(id).slice(0, 8)}`);

    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .upsert({ slug, name: rawName }, { onConflict: "slug" })
      .select("id, slug, name")
      .single();

    if (bizErr || !biz) {
      return NextResponse.json(
        { ok: false, where: "businesses.upsert", error: bizErr?.message || "Upsert failed" },
        { status: 400, headers: CORS }
      );
    }

    // 2) Upsert profile linking business_id
    const { error: profErr } = await supabaseAdmin
      .from("business_profiles")
      .upsert(
        [{
          id, // PK = auth.users.id
          nombre_negocio: rawName,
          nombre_contacto,
          telefono,
          email,
          business_id: biz.id,
          updated_at: new Date().toISOString(),
        }],
        { onConflict: "id" }
      );

    if (profErr) {
      const err = profErr as PostgrestError;
      return NextResponse.json(
        { ok: false, where: "business_profiles.upsert", error: err.message, details: err.details, hint: err.hint },
        { status: 500, headers: CORS }
      );
    }

    return NextResponse.json(
      { ok: true, startedAt, business_id: biz.id, slug: biz.slug },
      { status: 200, headers: CORS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, where: "unexpected", error: msg },
      { status: 500, headers: CORS }
    );
  }
}
