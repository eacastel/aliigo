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
  const startedAt = new Date().toISOString();
  try {
    const body = await req.json();
    const {
      id,
      nombre_negocio,
      nombre_contacto = null,
      telefono = null,
      email = null,
    } = body ?? {};

    console.log("[profiles/ensure] start", { startedAt, body });

    if (!id || !looksLikeUUID(id) || !nombre_negocio) {
      console.error("[profiles/ensure] bad input", { id, nombre_negocio });
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

    const keyFingerprint = serviceRoleKey.slice(0, 6) + "…";
    const projectRef =
      url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] ?? null;

    console.log("[profiles/ensure] envs present?", {
      hasURL: Boolean(url),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      urlProjectRef: projectRef,
      keyFingerprint,
    });

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 1) Ensure a business row (by slug) exists
    const rawName = String(nombre_negocio).trim() || "Negocio";
    const slug = toSlug(rawName, `biz-${String(id).slice(0, 8)}`);

    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .upsert({ slug, name: rawName }, { onConflict: "slug" })
      .select("id, slug, name")
      .single();

    if (bizErr || !biz) {
      console.error("[profiles/ensure] business upsert error", bizErr);
      return NextResponse.json(
        { error: bizErr?.message || "Failed to upsert business" },
        { status: 400 }
      );
    }

    // 2) Upsert profile WITH business_id (update if it already exists)
    const { error: profErr } = await supabaseAdmin
      .from("business_profiles")
      .upsert(
        [
          {
            id, // auth.users.id (PK)
            nombre_negocio: rawName,
            nombre_contacto,
            telefono,
            email,
            business_id: biz.id, // <-- link established
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" } // NOTE: no ignoreDuplicates here; we want updates
      );

    if (profErr) {
      const err = profErr as PostgrestError;
      console.error("[profiles/ensure] supabase error", {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint,
      });
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

    console.log("[profiles/ensure] success", { id, business_id: biz.id, slug: biz.slug });
    return NextResponse.json({ ok: true, id, business_id: biz.id, slug: biz.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[profiles/ensure] unexpected error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
