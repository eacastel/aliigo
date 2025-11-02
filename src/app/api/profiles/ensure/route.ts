import { NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  try {
    const body = await req.json();
    const {
      id, // auth.users.id
      nombre_negocio,
      nombre_contacto = null,
      telefono = null,
      email = null,
    } = body ?? {};

    if (!id || !looksLikeUUID(id) || !nombre_negocio) {
      return NextResponse.json(
        { error: "Missing/invalid fields: id(uuid), nombre_negocio" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: SUPABASE env vars are missing." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Create/ensure business by slug
    const rawName = String(nombre_negocio).trim() || "Negocio";
    const slug = toSlug(rawName, `biz-${String(id).slice(0, 8)}`);

    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .upsert({ slug, name: rawName }, { onConflict: "slug" })
      .select("id, slug, name")
      .single();

    if (bizErr || !biz) {
      return NextResponse.json(
        { error: bizErr?.message || "Failed to upsert business" },
        { status: 400 }
      );
    }

    // Upsert profile linked to business
    const { error: profErr } = await supabaseAdmin
      .from("business_profiles")
      .upsert(
        [
          {
            id,
            nombre_negocio: rawName,
            nombre_contacto,
            telefono,
            email,
            business_id: biz.id,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" }
      );

    if (profErr) {
      const err = profErr as PostgrestError;
      return NextResponse.json(
        {
          ok: false,
          supabase_error: {
            code: err.code,
            message: err.message,
            details: err.details,
            hint: err.hint,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id, business_id: biz.id, slug: biz.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
