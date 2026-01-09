// src/app/api/profiles/ensure/route.ts
import { NextResponse } from "next/server";
import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";

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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getAuthUserWithRetry(supabaseAdmin: SupabaseClient, id: string) {
  const waits = [0, 200, 600, 1200]; // ms
  for (const w of waits) {
    if (w) await sleep(w);
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (!error && data?.user) return data.user;
  }
  return null;
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const j = await req.json();
    return j && typeof j === "object" ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const startedAt = new Date().toISOString();

  try {
    const body = await readJson(req);

    const idRaw = body.id;
    const nombre_negocio = body.nombre_negocio;

    const nombre_contacto = (body.nombre_contacto ?? null) as string | null;
    const telefono = (body.telefono ?? null) as string | null;
    const email = (body.email ?? null) as string | null;

    // Optional extras
    const google_url = (body.google_url ?? null) as string | null;
    const source = (body.source ?? null) as string | null;

    if (!looksLikeUUID(idRaw) || typeof nombre_negocio !== "string" || !nombre_negocio.trim()) {
      return NextResponse.json(
        {
          ok: false,
          where: "input",
          error: "Missing/invalid fields: id(uuid), nombre_negocio",
        },
        { status: 400, headers: CORS }
      );
    }

    // ✅ TS-safe narrowing boundary
    const id = idRaw as string;


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

    // 0) Verify auth user exists (retry handles occasional propagation delay)
    const authUser = await getAuthUserWithRetry(supabaseAdmin, id);
    if (!authUser) {
      const host = (() => {
        try {
          return new URL(url).host;
        } catch {
          return url;
        }
      })();

      return NextResponse.json(
        {
          ok: false,
          where: "auth.admin.getUserById",
          error: "User not found in auth.users (after retry)",
          debug: { id, supabaseUrlHost: host },
        },
        { status: 409, headers: CORS }
      );
    }

    // 1) Ensure business
    const rawName = String(nombre_negocio).trim() || "Negocio";
    const slug = toSlug(rawName, `biz-${String(id).slice(0, 8)}`);

    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .upsert({ slug, name: rawName }, { onConflict: "slug" })
      .select("id, slug, name")
      .single();

    if (bizErr || !biz) {
      const err = bizErr as PostgrestError | null;
      return NextResponse.json(
        {
          ok: false,
          where: "businesses.upsert",
          error: err?.message || "Upsert failed",
          details: err?.details ?? null,
          hint: err?.hint ?? null,
        },
        { status: 400, headers: CORS }
      );
    }

    // 2) Upsert profile linking business_id
    const { error: profErr } = await supabaseAdmin
      .from("business_profiles")
      .upsert(
        [
          {
            id, // FK -> auth.users.id
            nombre_negocio: rawName,
            nombre_contacto,
            telefono,
            email,
            google_url, // remove if column doesn't exist
            source, // remove if column doesn't exist
            business_id: biz.id,
            updated_at: new Date().toISOString(),
          },
        ],
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
