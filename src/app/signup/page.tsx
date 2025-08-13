"use client";

// File: app/signup/page.tsx
// Purpose:
//   Collect user + business info, create Supabase Auth user (unconfirmed),
//   then create the business profile via a server route, and finally
//   redirect to /dashboard (where we show an "unconfirmed" banner until email is confirmed).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  // 🧾 Form state (controlled inputs)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefono, setTelefono] = useState("");

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Public URL used by Supabase to send the confirmation email redirect link
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aliigo.vercel.app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) Create auth user (unconfirmed email at this point)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // After the user clicks the email link, Supabase will redirect them here
          // (You already have login/reset; keeping this simple per your flow)
          emailRedirectTo: `${SITE_URL}/dashboard`,
        },
      });

      // 1a) Clear message for duplicate email (user already exists)
      if (signUpError) {
        const msg = (signUpError.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("user already registered")) {
          setError("Este email ya existe. Inicia sesión o restablece tu contraseña.");
        } else {
          setError("No pudimos crear tu cuenta. Inténtalo de nuevo.");
        }
        return;
      }

      // 1b) We expect a user id even if unconfirmed
      const userId = data?.user?.id;
      if (!userId) {
        setError("No se pudo obtener el usuario después del registro.");
        return;
      }

      // 2) Create business profile on the server (insert only)
      //    This succeeds even if the user hasn't confirmed the email yet.
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
        // Not fatal for auth; the user can still land on dashboard
        console.error("Fallo al crear el perfil de negocio (server).");
      }

      // 3) Redirect to dashboard
      router.replace("/dashboard");
    } catch (e: unknown) {
      // ESLint-friendly logging
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
        {/* --- Business fields --- */}
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

        {/* --- Credentials --- */}
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
          className="w-full bg-black text-white rounded px-4 py-2"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
