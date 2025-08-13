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
 *   - No more "pending signup" localStorage flow
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BusinessProfile = {
  id: string;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  created_at: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  // UI/state
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) Require session; if missing (or invalid), redirect to login
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) router.replace("/login?redirect=/dashboard");
        return;
      }

      // 2) Load the business profile by PK: id = auth.users.id
      const { data: row, error } = await supabase
        .from("business_profiles")
        .select("id,nombre_negocio,nombre_contacto,telefono,created_at")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        // Not fatal; log for diagnostics
        // console.error("Error cargando perfil:", error.message);
      }

      if (!cancelled) {
        setBusiness(row ?? null);

        // 3) Trial days = 30 days from created_at
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

    return () => { cancelled = true; };
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
        Bienvenido a Aliigo{business?.nombre_contacto ? `, ${business.nombre_contacto}` : ""} 👋
      </h1>

      {daysLeft !== null && (
        <div className="mb-6 text-sm text-gray-700">
          ⏳ Te quedan <strong>{daysLeft}</strong> días de prueba
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

      {/* Feature grid (enabled; we can gate later by plan/confirmation if needed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Solicitar reseñas</h2>
          <p className="text-sm text-gray-600">
            Envía solicitudes de reseñas a tus clientes.
          </p>
        </div>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Campañas SMS</h2>
          <p className="text-sm text-gray-600">
            Crea y lanza campañas de mensajería directa.
          </p>
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
