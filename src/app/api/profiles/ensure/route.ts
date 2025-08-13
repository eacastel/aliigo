// File: app/api/profiles/ensure/route.ts
// Purpose:
//   Insert a business profile row for a newly signed-up user.
//   If the row already exists (same PK = auth.users.id), we do nothing
//   and return OK (no overwrite).
//
// Why server route?
//   - We need to create the profile even if the email is unconfirmed and
//     there is no client session yet. The Service Role key can do that,
//     but it must ONLY run on the server.
//
// Security:
//   - Put SUPABASE_SERVICE_ROLE_KEY in Vercel env vars (project > settings > env).
//   - NEVER expose it to client-side code.

import { NextResponse } from "next/server";
import { createClient, type PostgrestError } from "@supabase/supabase-js"; // 👈 typed PostgrestError

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // ⚠️ server-only

// Admin client with Service Role (bypasses RLS, used ONLY on server)
const supabaseAdmin = createClient(url, serviceRoleKey);

// Type predicate to check for the PostgrestError.code without using `any`
function isUniqueViolation(err: unknown): boolean {
  // PostgrestError has a `code?: string`
  const code = (err as Pick<PostgrestError, "code"> | undefined)?.code;
  return code === "23505"; // duplicate key / unique violation
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ minimal validation
    const {
      id,                   // PK = auth.users.id
      nombre_negocio,       // required
      nombre_contacto = null,
      telefono = null,
    } = body ?? {};

    if (!id || !nombre_negocio) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: id, nombre_negocio" },
        { status: 400 }
      );
    }

    // ✅ INSERT only — we DO NOT overwrite on conflict
    const { error } = await supabaseAdmin
      .from("business_profiles")
      .insert([{ id, nombre_negocio, nombre_contacto, telefono }]);

    if (error) {
      // If row already exists (create-if-not-exists semantics), accept and return OK
      if (isUniqueViolation(error)) {
        return NextResponse.json({ ok: true, note: "Ya existía, no se sobreescribe." });
      }
      // Any other DB error → 500
      console.error("Insert business_profile error:", error.message);
      return NextResponse.json({ error: "No se pudo crear el perfil." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    // Safe, ESLint-friendly error logging
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
