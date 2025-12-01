// src/app/(public)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getPublicOrigin } from "@/lib/url";

type Status = "idle" | "loading" | "error";

export default function SignupWaitlistPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [website, setWebsite] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    // Validaciones igual que antes
    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      setStatus("error");
      return;
    }
    if (!/\d/.test(password)) {
      setErrorMessage("La contraseña debe incluir al menos un número.");
      setStatus("error");
      return;
    }
    if (telefono && !/^[0-9+\-\s]{6,20}$/.test(telefono)) {
      setErrorMessage("El teléfono no es válido.");
      setStatus("error");
      return;
    }

    try {
      const origin = getPublicOrigin();

      // === Supabase signup (igual que antes) ===
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });

      if (signUpError) {
        const msg = (signUpError.message || "").toLowerCase();
        if (msg.includes("already")) {
          setErrorMessage(
            "Este email ya existe. Inicia sesión o restablece tu contraseña."
          );
        } else {
          setErrorMessage(signUpError.message || "No pudimos crear tu cuenta.");
        }
        setStatus("error");
        return;
      }

      const userId = data?.user?.id;
      if (!userId) {
        setErrorMessage("No se pudo obtener el usuario después del registro.");
        setStatus("error");
        return;
      }

      // === business_profiles upsert (igual que antes) ===
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

      // Parse response safely
      let payload: { ok?: boolean; error?: string } = {};
      try {
        payload = (await resp.json()) as { ok?: boolean; error?: string };
      } catch {
        // leave payload as empty object if JSON fails
      }

      if (!resp.ok || payload.ok === false) {
        console.error(
          "[signup] /api/profiles/ensure failed:",
          resp.status,
          payload
        );

        setErrorMessage(
          payload.error || `No se pudo guardar el perfil (HTTP ${resp.status}).`
        );
        setStatus("error");
        return;
      }

      // === marcador local de alta pendiente (igual que antes) ===
      try {
        localStorage.setItem(
          "aliigo_pending_signup",
          JSON.stringify({
            email: email.trim(),
            businessName: nombreNegocio,
            contactName: nombreContacto,
            phone: telefono,
            website,
            createdAtMs: Date.now(),
          })
        );
      } catch {
        // ignoramos error de localStorage
      }

      // ✅ NUEVO: en vez de ir al dashboard, vamos a página de gracias / revisión
      router.replace("/check-email");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error inesperado al crear la cuenta."
      );
      setStatus("error");
    } finally {
      setStatus((prev) => (prev === "loading" ? "idle" : prev));
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Solicitar invitación a Aliigo
        </h1>
        <p className="mt-3 text-zinc-300 text-sm">
          Durante el lanzamiento, Aliigo está disponible solo por invitación.
          Crea tu cuenta y cuéntanos un poco sobre tu negocio. Revisaremos tu
          solicitud y, si encaja con el programa, activaremos tu acceso.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Email de contacto *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Tu nombre
            </label>
            <input
              type="text"
              value={nombreContacto}
              onChange={(e) => setNombreContacto(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Nombre del negocio *
            </label>
            <input
              type="text"
              required
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Web o ficha de Google
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Teléfono
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Contraseña *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                autoComplete="new-password"
              />
            </div>
          </div>

          {status === "error" && (
            <p className="text-sm text-red-400">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center rounded-lg bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 w-full"
          >
            {status === "loading"
              ? "Enviando..."
              : "Crear cuenta y solicitar invitación"}
          </button>
        </form>

        <p className="mt-6 text-xs text-zinc-500">
          Usaremos tus datos solo para ponernos en contacto sobre Aliigo y la
          activación de tu cuenta.
        </p>
      </div>
    </main>
  );
}
