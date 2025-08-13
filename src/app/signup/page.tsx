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
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aliigo.vercel.app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) Create the auth user (email unconfirmed until they click the email)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // After confirming, Supabase will redirect to /dashboard
          emailRedirectTo: `${SITE_URL}/dashboard`,
        },
      });

      // Handle duplicate email or other signup errors
      if (signUpError) {
        const msg = (signUpError.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("user already registered")) {
          setError("Este email ya existe. Inicia sesión o restablece tu contraseña.");
        } else {
          setError("No pudimos crear tu cuenta. Inténtalo de nuevo.");
        }
        return;
      }

      // We expect a user id even if unconfirmed
      const userId = data?.user?.id;
      if (!userId) {
        setError("No se pudo obtener el usuario después del registro.");
        return;
      }

      // 2) Insert business profile on the server (insert-only; no overwrite on conflict)
      const resp = await fetch("/api/profiles/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          nombre_negocio: nombreNegocio,
          nombre_contacto: nombreContacto,
          telefono,
        }),
      });

      if (!resp.ok) {
        // Not fatal to the flow; dashboard will still load and show banner
        console.error("Fallo al crear el perfil de negocio (server).");
      }

      // 3) Stash a "pending signup" marker so /dashboard can show banner/trial without a session yet
      try {
        const pending = {
          email: email.trim(),
          businessName: nombreNegocio,     // ✅ use your actual state variable
          contactName: nombreContacto,     // ✅ use your actual state variable
          phone: telefono,                  // ✅ use your actual state variable
          createdAtMs: Date.now(),          // used for client-side trial countdown UX
        };
        localStorage.setItem("aliigo_pending_signup", JSON.stringify(pending));
      } catch {
        // If storage is unavailable, /dashboard will just redirect to /signup when no session
      }

      // 4) Go to dashboard regardless of session (per your flow)
      router.replace("/dashboard");
    } catch (e: unknown) {
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
          <label className="block text-sm font-medium mb-1">Nombre del negocio</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={nombreNegocio}
            onChange={(e) => setNombreNegocio(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
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
