// File: app/api/profiles/ensure/route.ts
// Goal:
// - Avoid reading env vars at module scope (which breaks at build time).
// - Ensure Node.js runtime and dynamic execution (no static optimization).
// - Keep service role ONLY on the server.

import { NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

// Force Node runtime (service key is not allowed on Edge) and dynamic execution
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Alternatively (either is fine):
// export const revalidate = 0;

function isUniqueViolation(err: unknown): err is Pick<PostgrestError, "code"> {
  return typeof (err as { code?: unknown })?.code === "string"
    && (err as { code: string }).code === "23505";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      id,                   // PK = auth.users.id (uuid)
      nombre_negocio,       // required
      nombre_contacto = null,
      telefono = null,
    } = body ?? {};

    if (!id || !nombre_negocio) {
      return NextResponse.json(
        { error: "Missing required fields: id, nombre_negocio" },
        { status: 400 }
      );
    }

    // IMPORTANT: Read env vars INSIDE the handler, at request time.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      // Don’t throw during build; return a clear runtime error instead.
      return NextResponse.json(
        { error: "Server misconfigured: SUPABASE env vars are missing." },
        { status: 500 }
      );
    }

    // Create the admin client at request time (safe on server only)
    const supabaseAdmin = createClient(url, serviceRoleKey);

    // INSERT only — do not overwrite on conflict.
    const { error } = await supabaseAdmin
      .from("business_profiles")
      .insert([{ id, nombre_negocio, nombre_contacto, telefono }]);

    if (error) {
      if (isUniqueViolation(error)) {
        return NextResponse.json({ ok: true, note: "Already existed; not overwritten." });
      }
      // Use a type guard here so TS knows .message exists
      const msg = (error as PostgrestError).message ?? "Unknown error";
      console.error("Insert business_profile error:", msg);
      return NextResponse.json({ error: "Could not create profile." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
