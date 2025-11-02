// src/app/(public)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getPublicOrigin } from "@/lib/url";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefono, setTelefono] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (!/\d/.test(password)) return setError("La contraseña debe incluir al menos un número.");
    if (telefono && !/^[0-9+\-\s]{6,20}$/.test(telefono)) return setError("El teléfono no es válido.");

    setLoading(true);
    try {
      const origin = getPublicOrigin();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` }, 
      });

      if (signUpError) {
        const msg = (signUpError.message || "").toLowerCase();
        if (msg.includes("already")) {
          setError("Este email ya existe. Inicia sesión o restablece tu contraseña.");
        } else {
          setError(signUpError.message || "No pudimos crear tu cuenta.");
        }
        return;
      }

      const userId = data?.user?.id;
      if (!userId) {
        setError("No se pudo obtener el usuario después del registro.");
        return;
      }

      // Create business + profile on the server
      const resp = await fetch("/api/profiles/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          nombre_negocio: nombreNegocio,
          nombre_contacto: nombreContacto || null,
          telefono: telefono || null,
          email,
        }),
      });

      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok || payload?.ok === false) {
        console.error("[signup] /api/profiles/ensure failed:", resp.status, payload);
        setError(payload?.error || `No se pudo guardar el perfil (HTTP ${resp.status}).`);
        return;
      }

      // Marker for pending trial
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
      } catch {}

      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado al crear la cuenta.");
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
        {/* Business */}
        <div>
          <label className="block text-sm mb-1">Nombre del negocio</label>
          <input className="w-full border rounded px-3 py-2" value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Nombre de contacto</label>
          <input className="w-full border rounded px-3 py-2" value={nombreContacto} onChange={(e) => setNombreContacto(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Teléfono</label>
          <input className="w-full border rounded px-3 py-2" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>

        {/* Credentials */}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
