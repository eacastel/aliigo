"use client";

/**
 * File: app/dashboard/page.tsx
 * Purpose:
 *   Allow "sneak peek" of the dashboard while email confirmation is required.
 *   - If there is NO session but a localStorage marker ("aliigo_pending_signup") exists,
 *     show a limited dashboard (banner + trial days) and disable features.
 *   - If there IS a session, load real business profile, compute trial days, and
 *     keep features disabled until email is confirmed.
 *   - If neither a session nor the marker exist, redirect to /signup.
 *
 * Notes:
 *   - UI text: Spanish (Castilian)
 *   - Code + comments: English
 *   - The pending marker is written by /signup and includes:
 *       { email, businessName?, contactName?, phone?, createdAtMs }
 *   - Do NOT trust marker for sensitive data; it's UX-only. RLS protects real queries.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BusinessProfile = {
  id: string;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  created_at: string | null;
};

type PendingSignup = {
  email: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  createdAtMs: number;
};

export default function DashboardPage() {
  const router = useRouter();

  // UI state
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingSignup | null>(null);

  // Load session + either show pending view or real data
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData.session?.user ?? null;

        if (!sessionUser) {
          // No session → check for pending marker
          let marker: PendingSignup | null = null;
          try {
            const raw = localStorage.getItem("aliigo_pending_signup");
            if (raw) marker = JSON.parse(raw) as PendingSignup;
          } catch {
            // ignore bad JSON
          }

          if (marker) {
            // Show limited dashboard + trial days (derived from marker.createdAtMs)
            if (!cancelled) {
              setPending(marker);
              setIsConfirmed(false);

              const daysPassed = Math.floor((Date.now() - marker.createdAtMs) / 86_400_000);
              setDaysLeft(Math.max(30 - daysPassed, 0));
              setBusiness(null);
            }
            return;
          }

          // No session and no marker → send to signup
          router.replace("/signup");
          return;
        }

        // Session exists → clear stale marker and load real data
        try {
          localStorage.removeItem("aliigo_pending_signup");
        } catch {}

        if (!cancelled) {
          setIsConfirmed(Boolean(sessionUser.email_confirmed_at));
        }

        const { data: row, error } = await supabase
          .from("business_profiles")
          .select("id,nombre_negocio,nombre_contacto,telefono,created_at")
          .eq("id", sessionUser.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          // Non-fatal; render page anyway
          // eslint-disable-next-line no-console
          console.error("Error loading business profile:", (error as { message?: string })?.message ?? error);
        }

        if (!cancelled) {
          if (row) {
            setBusiness(row);

            // Compute trial days from created_at
            if (row.created_at) {
              const createdAt = new Date(row.created_at).getTime();
              const daysPassed = Math.floor((Date.now() - createdAt) / 86_400_000);
              setDaysLeft(Math.max(30 - daysPassed, 0));
            } else {
              setDaysLeft(null);
            }
          } else {
            setBusiness(null);
            setDaysLeft(null);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Unexpected error in dashboard load:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Auto-refresh email confirmation every 10s (user might confirm in another tab)
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      setIsConfirmed(Boolean(data.session?.user?.email_confirmed_at));
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Whether features should be disabled (pending or not confirmed)
  const featuresDisabled = useMemo(() => {
    if (pending) return true;
    if (!isConfirmed) return true;
    return false;
  }, [pending, isConfirmed]);

  // Resend confirmation (works both with session and without)
  const handleResend = async () => {
    // When we have a session, prefer that email; otherwise, use pending.email
    const { data } = await supabase.auth.getSession();
    const userEmail = data.session?.user?.email ?? pending?.email;
    if (!userEmail) return;

    await supabase.auth.resend({
      type: "signup",
      email: userEmail,
      options: process.env.NEXT_PUBLIC_SITE_URL
        ? { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` }
        : undefined,
    });
    // You can hook a toast here if you use one
    alert("Si existe una cuenta con ese correo, hemos reenviado el mensaje de verificación.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <p className="text-sm text-gray-600">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-4">
        {/* Friendly greeting: fallback if we don't have profile yet */}
        Bienvenido/a a Aliigo{business?.nombre_contacto ? `, ${business.nombre_contacto}` : ""} 👋
      </h1>

      {/* === No session, but pending signup marker present === */}
      {!business && pending && (
        <>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-6 rounded">
            ⚠️ Confirma tu correo para activar tu cuenta. Hemos enviado un enlace a{" "}
            <strong>{pending.email}</strong>.
            <div className="mt-2">
              <button
                onClick={handleResend}
                className="inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-yellow-200"
              >
                Reenviar correo de verificación
              </button>
            </div>
          </div>

          {daysLeft !== null && (
            <div className="mb-6 text-sm text-gray-700">⏳ Te quedan {daysLeft} días de prueba.</div>
          )}

          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">{pending.businessName ?? "Tu negocio"}</h2>
            <p className="text-gray-700">
              <strong>Contacto:</strong> {pending.contactName ?? "—"}
            </p>
            <p className="text-gray-700">
              <strong>Correo:</strong> {pending.email}
            </p>
            <p className="text-gray-700">
              <strong>Teléfono:</strong> {pending.phone ?? "—"}
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Las funciones estarán deshabilitadas hasta que confirmes tu correo electrónico.
            </p>
          </div>
        </>
      )}

      {/* === Session present (real profile loaded) === */}
      {business && (
        <>
          {!isConfirmed && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-6 rounded">
              ⚠️ Tu cuenta aún no está verificada. Revisa tu bandeja de entrada para activarla.
              <div className="mt-2">
                <button
                  onClick={handleResend}
                  className="inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-yellow-200"
                >
                  Reenviar correo de verificación
                </button>
              </div>
            </div>
          )}

          {daysLeft !== null && (
            <div className="mb-6 text-sm text-gray-700">⏳ Te quedan {daysLeft} días de prueba.</div>
          )}

          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">{business.nombre_negocio ?? "Tu negocio"}</h2>
            <p className="text-gray-700">
              <strong>Contacto:</strong> {business.nombre_contacto ?? "—"}
            </p>
            <p className="text-gray-700">
              <strong>Teléfono:</strong> {business.telefono ?? "—"}
            </p>
          </div>
        </>
      )}

      {/* Feature grid (disabled until confirmed OR when pending) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${featuresDisabled ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Solicitar reseñas</h2>
          <p className="text-sm text-gray-600">Envía solicitudes de reseñas a tus clientes.</p>
        </div>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Campañas SMS</h2>
          <p className="text-sm text-gray-600">Crea y lanza campañas de mensajería directa.</p>
        </div>
        {/* Add more feature cards here */}
      </div>
    </div>
  );
}
