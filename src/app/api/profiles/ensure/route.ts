// File: app/api/profiles/ensure/route.ts
// Purpose:
//   Insert a business profile row for a newly signed-up user.
//   If the row already exists (same PK = auth.users.id), do nothing and return OK (no overwrite).
//
// Deploy/Runtime notes:
//   - Uses Node.js runtime (service role cannot run on Edge).
//   - Marked dynamic so it only evaluates at request time (not during build).
//   - Reads env vars *inside* the handler to avoid build-time failures on Vercel.
//
// Security:
//   - Set env vars in Vercel:
//       NEXT_PUBLIC_SUPABASE_URL            (Public)
//       SUPABASE_SERVICE_ROLE_KEY           (Server-only)
//   - Never expose the service role key to client code.

import { NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUniqueViolation(err: unknown): err is Pick<PostgrestError, "code"> {
  return typeof (err as { code?: unknown })?.code === "string"
    && (err as { code: string }).code === "23505"; // unique_violation
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Minimal input validation
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

    // Read env vars *at request time* (prevents build-time crashes)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: SUPABASE env vars are missing." },
        { status: 500 }
      );
    }

    // Service-role client (server-only)
    const supabaseAdmin = createClient(url, serviceRoleKey);

    // INSERT only — do not overwrite on conflict
    const { error } = await supabaseAdmin
      .from("business_profiles")
      .insert([{ id, nombre_negocio, nombre_contacto, telefono }]);

    if (error) {
      if (isUniqueViolation(error)) {
        // "Create if not exists" semantics
        return NextResponse.json({ ok: true, note: "Already existed; not overwritten." });
      }
      // ✅ Use explicit PostgrestError to avoid TS 'never' + ESLint issues
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
