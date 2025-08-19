"use client";

/**
 * File: src/app/dashboard/page.tsx
 * Purpose:
 *   Auth-only dashboard:
 *   - If there's NO session → redirect to /login?redirect=/dashboard
 *   - If there's a session → load business profile and show trial days + features
 * Notes:
 *   - UI text: Spanish
 *   - Comments: English
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { enforceValidSession, watchAuthAndRedirect } from "@/lib/auth-guard";

type BusinessProfile = {
  id: string;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  created_at: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    // 1) Watch for auth changes (sign-out elsewhere, token revoked, etc.)
    const unsubscribe = watchAuthAndRedirect(router, "/login?redirect=/dashboard");

    (async () => {
      // 2) Enforce a real session (kicks out “stranded” sessions)
      const user = await enforceValidSession(router, "/login?redirect=/dashboard");
      if (!user) return; // redirected by guard

      // 3) Load business profile for the authenticated user
      const { data: row, error } = await supabase
        .from("business_profiles")
        .select("id,nombre_negocio,nombre_contacto,telefono,created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        // Optional: log for diagnostics in Vercel console
        console.error("[dashboard] error loading profile:", error.message);
      }

      if (!cancelled) {
        setBusiness(row ?? null);

        if (row?.created_at) {
          const createdAt = new Date(row.created_at);
          const daysPassed = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
          setDaysLeft(Math.max(30 - daysPassed, 0));
        } else {
          setDaysLeft(null);
        }

        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-600">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-4">
        Bienvenido a Aliigo{business?.nombre_contacto ? `, ${business.nombre_contacto}` : ""}
      </h1>

      {daysLeft !== null && (
        <div className="mb-6 text-sm text-gray-700">
          Te quedan <strong>{daysLeft}</strong> días de prueba
        </div>
      )}

      {business ? (
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {business.nombre_negocio ?? "Tu negocio"}
          </h2>
          <p className="text-gray-700">
            <strong>Contacto:</strong> {business.nombre_contacto ?? "—"}
          </p>
          <p className="text-gray-700">
            <strong>Teléfono:</strong> {business.telefono ?? "—"}
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-6">
          No encontramos información de tu negocio aún.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Solicitar reseñas</h2>
          <p className="text-sm text-gray-600">Envía solicitudes de reseñas a tus clientes.</p>
        </div>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Campañas SMS</h2>
          <p className="text-sm text-gray-600">Crea y lanza campañas de mensajería directa.</p>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
          className="border px-4 py-2 rounded hover:bg-gray-50"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
