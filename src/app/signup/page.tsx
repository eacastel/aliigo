"use client";

// File: app/signup/page.tsx
// Purpose:
//   Collect user + business info, create Supabase Auth user (email unconfirmed),
//   insert the business profile via a server route (insert-only),
//   then redirect to /dashboard right away.
//   The dashboard will show "check your email" + trial while unconfirmed.
//
// Notes:
//   - We stash a lightweight "pending signup" marker in localStorage so the
//     dashboard can show the banner/trial even if there is no session yet.
//   - Ensure NEXT_PUBLIC_SITE_URL points to your live domain so email links are correct.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  // Form state (controlled inputs)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefono, setTelefono] = useState("");

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Used by Supabase to build the email confirmation redirect
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://aliigo.vercel.app";

  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // 1) Crear usuario (queda sin confirmar hasta click en email)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${SITE_URL}/login?from=confirm` },
    });

    if (signUpError) {
      const msg = (signUpError.message || "").toLowerCase();
      if (msg.includes("already registered") || msg.includes("user already registered")) {
        setError("Este email ya existe. Inicia sesión o restablece tu contraseña.");
      } else {
        setError("No pudimos crear tu cuenta. Inténtalo de nuevo.");
      }
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      setError("No se pudo obtener el usuario después del registro.");
      return;
    }

    // 2) Insertar perfil de negocio una sola vez, con logging claro
    const profileResp = await fetch("/api/profiles/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        nombre_negocio: nombreNegocio,
        nombre_contacto: nombreContacto,
        telefono,
        email,
      }),
    });

    const profileJson: unknown = await profileResp.json().catch(() => ({}));

    if (!profileResp.ok) {
      console.error("Profile insert failed:", {
        status: profileResp.status,
        json: profileJson,
      });
      // No es fatal: seguimos al dashboard, el banner avisará de confirmación pendiente
    } else {
      console.log("Profile insert OK:", profileJson);
    }

    // 3) Guardar marcador local para UX pre‑confirmación
    try {
      localStorage.setItem(
        "aliigo_pending_signup",
        JSON.stringify({
          email: email.trim(),
          businessName: nombreNegocio,
          contactName: nombreContacto,
          phone: telefono,
          createdAtMs: Date.now(),
        })
      );
    } catch {
      /* sin bloqueo */
    }

    // 4) Redirigir al dashboard
router.replace(`/check-email?email=${encodeURIComponent(email.trim())}`);
  } catch (e) {
    setError(e instanceof Error ? e.message : "Error inesperado.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-md mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Crea tu cuenta</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Business fields */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre del negocio
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            value={nombreNegocio}
            onChange={(e) => setNombreNegocio(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre de contacto
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            value={nombreContacto}
            onChange={(e) => setNombreContacto(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

        {/* Credentials */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
