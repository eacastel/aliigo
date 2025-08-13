import { NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const looksLikeUUID = (v: unknown) =>
  typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);

export async function POST(req: Request) {
  const startedAt = new Date().toISOString();
  try {
    const body = await req.json();
    const { id, nombre_negocio, nombre_contacto = null, telefono = null, email = null } = body ?? {};


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


    // Safe fingerprints for quick sanity checks (DON'T log full secrets)
    const keyFingerprint = serviceRoleKey ? serviceRoleKey.slice(0, 6) + "…" : null;
    const projectRef = url?.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] ?? null;

    console.log("[profiles/ensure] envs present?", {
      hasURL: Boolean(url),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      urlProjectRef: projectRef,
      keyFingerprint,
    });

if (!url || !serviceRoleKey) {
  return NextResponse.json(
    { error: "Server misconfigured: SUPABASE env vars are missing." },
    { status: 500 }
  );
}
console.log("[profiles/ensure] using URL:", url);
const supabaseAdmin = createClient(url, serviceRoleKey);

    const { error } = await supabaseAdmin
      .from("business_profiles")
      .upsert(
        [{ id, nombre_negocio, nombre_contacto, telefono, email }],
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (error) {
      const err = error as PostgrestError;

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
    console.log("[profiles/ensure] using URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("[profiles/ensure] success", { id });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);

    console.error("[profiles/ensure] unexpected error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
