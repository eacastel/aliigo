"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BusinessProfile } from "@/types/supabase";

export default function DashboardPage() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      setIsConfirmed(!!user.email_confirmed_at);

      const { data, error } = await supabase
        .from("business_profiles")
        .select()
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading business profile:", error.message);
        return;
      }

      if (data) {
        setBusiness(data);

        // Calculate trial days left
        const createdAt = new Date(data.created_at);
        const today = new Date();
        const daysPassed = Math.floor(
          (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const trialDays = 30;
        setDaysLeft(Math.max(trialDays - daysPassed, 0));
      }
    };

    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-4">
        Bienvenido a Aliigo, {business?.nombre_contacto || "usuario"} 👋
      </h1>

      {!isConfirmed && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
          ⚠️ Tu cuenta aún no está confirmada. Revisa tu correo electrónico para
          activarla y desbloquear todas las funciones.
        </div>
      )}

      {daysLeft !== null && (
        <div className="mb-6 text-sm text-gray-600">
          ⏳ {daysLeft} días restantes de prueba gratuita
        </div>
      )}

      {business && (
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">{business.nombre_negocio}</h2>
          <p className="text-gray-700">
            <strong>Contacto:</strong> {business.nombre_contacto}
          </p>
          <p className="text-gray-700">
            <strong>Teléfono:</strong> {business.telefono}
          </p>
          {daysLeft !== null && (
            <p className="mt-4 text-sm text-gray-500">
              Te quedan {daysLeft} días de prueba.
            </p>
          )}
        </div>
      )}

      <div
        className={`grid grid-cols-2 gap-4 ${
          !isConfirmed ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Enviar reseñas</h2>
          <p className="text-sm text-gray-600">
            Funcionalidad para enviar solicitudes de reseñas a tus clientes.
          </p>
        </div>

        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Campañas de SMS</h2>
          <p className="text-sm text-gray-600">
            Crea y lanza campañas de mensajería directa.
          </p>
        </div>
      </div>
    </div>
  );
}
