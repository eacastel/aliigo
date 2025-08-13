"use client";

// File: app/dashboard/page.tsx
// Purpose:
//   Gate the page behind auth, show a banner if email is unconfirmed,
//   load the business profile by PK `id = auth.users.id`,
//   and show trial days based on profile.created_at.

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

  // --- UI/State ---
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  // 1) Load session + profile
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // 1a) Get current session
        const { data: { session } } = await supabase.auth.getSession();

        // If not logged in → redirect to signup (you already have login/reset flows, keeping your flow)
        if (!session?.user) {
          router.replace("/signup");
          return;
        }

        // 1b) Track email confirmation
        const user = session.user;
        setIsConfirmed(Boolean(user.email_confirmed_at));

        // 1c) Load profile by PK id = user.id
        const { data: row, error } = await supabase
          .from("business_profiles")
          .select("id,nombre_negocio,nombre_contacto,telefono,created_at")
          .eq("id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          // Not fatal; page still renders
          console.error("Error loading business profile:", error.message);
        }

        if (!cancelled && row) {
          setBusiness(row);

          // 1d) Compute trial days: 30 days from created_at
          if (row.created_at) {
            const createdAt = new Date(row.created_at);
            const daysPassed = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
            setDaysLeft(Math.max(30 - daysPassed, 0));
          } else {
            setDaysLeft(null);
          }
        }
      } catch (e: unknown) {
        // ESLint-friendly error logging
        if (e instanceof Error) {
          console.error("Unexpected error in dashboard load:", e.message);
        } else {
          console.error("Unexpected error in dashboard load:", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true; // avoid setState after unmount
    };
  }, [router]);

  // 2) BONUS: auto-refresh email confirmation state every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsConfirmed(Boolean(session?.user?.email_confirmed_at));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 3) Loading screen while we check session/profile
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-600">Cargando…</p>
      </div>
    );
  }

  // 4) Page content
  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-4">
        {/* Greeting with safe fallbacks */}
        Bienvenido a Aliigo, {business?.nombre_contacto ?? "usuario"} 👋
      </h1>

      {/* Banner if email not confirmed */}
      {!isConfirmed && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
          ⚠️ Tu cuenta aún no está confirmada. Revisa tu correo para activarla.
        </div>
      )}

      {/* Trial days */}
      {daysLeft !== null && (
        <div className="mb-6 text-sm text-gray-600">
          ⏳ {daysLeft} días restantes de prueba gratuita
        </div>
      )}

      {/* Business profile card */}
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
          {daysLeft !== null && (
            <p className="mt-4 text-sm text-gray-500">
              Te quedan {daysLeft} días de prueba.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 mb-6 rounded">
          Aún no has completado tu perfil de negocio.
        </div>
      )}

      {/* Feature grid (disabled while unconfirmed) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!isConfirmed ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Enviar reseñas</h2>
          <p className="text-sm text-gray-600">
            Envía solicitudes de reseñas a tus clientes.
          </p>
        </div>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Campañas de SMS</h2>
          <p className="text-sm text-gray-600">
            Crea y lanza campañas de mensajería.
          </p>
        </div>
      </div>
    </div>
  );
}
