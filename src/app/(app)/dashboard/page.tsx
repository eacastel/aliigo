"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

type BusinessProfile = {
  id: string;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  created_at: string | null;
  business_id?: string | null; // ✅ add this
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

  // ✅ Hooks live INSIDE the component
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [bizSlug, setBizSlug] = useState<string | null>(null); // ✅ for the widget

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData.session?.user ?? null;

        if (!sessionUser) {
          // No session → check pending marker
          let marker: PendingSignup | null = null;
          try {
            const raw = localStorage.getItem("aliigo_pending_signup");
            if (raw) marker = JSON.parse(raw) as PendingSignup;
          } catch {}

          if (marker) {
            if (!cancelled) {
              setPending(marker);
              setIsConfirmed(false);
              const daysPassed = Math.floor((Date.now() - marker.createdAtMs) / 86_400_000);
              setDaysLeft(Math.max(30 - daysPassed, 0));
              setBusiness(null);
              setBizSlug("horchata-labs"); // fallback slug during pending
            }
            return;
          }

          router.replace("/signup");
          return;
        }

        // Session exists → clear marker & check confirmation
        try {
          localStorage.removeItem("aliigo_pending_signup");
        } catch {}

        if (!cancelled) {
          setIsConfirmed(Boolean(sessionUser.email_confirmed_at));
        }

        // Load profile (now selecting business_id too)
        const { data: row, error } = await supabase
          .from("business_profiles")
          .select("id,nombre_negocio,nombre_contacto,telefono,created_at,business_id")
          .eq("id", sessionUser.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error loading business profile:", (error as { message?: string })?.message ?? error);
        }

        if (cancelled) return;

        if (row) {
          setBusiness(row);

          if (row.created_at) {
            const createdAt = new Date(row.created_at).getTime();
            const daysPassed = Math.floor((Date.now() - createdAt) / 86_400_000);
            setDaysLeft(Math.max(30 - daysPassed, 0));
          } else {
            setDaysLeft(null);
          }

          // ✅ Resolve slug from business_id
          if (row.business_id) {
            const { data: bizRow, error: bizErr } = await supabase
              .from("businesses")
              .select("slug")
              .eq("id", row.business_id)
              .single();
            if (!bizErr && bizRow?.slug && !cancelled) setBizSlug(bizRow.slug);
          } else {
            setBizSlug("horchata-labs"); // fallback if not linked yet
          }
        } else {
          setBusiness(null);
          setDaysLeft(null);
          setBizSlug("horchata-labs"); // conservative fallback
        }
      } catch (e) {
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

  // Auto-refresh email confirmation every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      setIsConfirmed(Boolean(data.session?.user?.email_confirmed_at));
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const featuresDisabled = useMemo(() => {
    if (pending) return true;
    if (!isConfirmed) return true;
    return false;
  }, [pending, isConfirmed]);

  const handleResend = async () => {
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
        Bienvenido/a a Aliigo{business?.nombre_contacto ? `, ${business.nombre_contacto}` : ""} 👋
      </h1>

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
            <p className="text-gray-700"><strong>Contacto:</strong> {pending.contactName ?? "—"}</p>
            <p className="text-gray-700"><strong>Correo:</strong> {pending.email}</p>
            <p className="text-gray-700"><strong>Teléfono:</strong> {pending.phone ?? "—"}</p>
            <p className="mt-4 text-sm text-gray-500">Las funciones estarán deshabilitadas hasta que confirmes tu correo electrónico.</p>
          </div>
        </>
      )}

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
            <p className="text-gray-700"><strong>Contacto:</strong> {business.nombre_contacto ?? "—"}</p>
            <p className="text-gray-700"><strong>Teléfono:</strong> {business.telefono ?? "—"}</p>
          </div>
        </>
      )}

      {/* Features (disabled until confirmed or pending) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${featuresDisabled ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Solicitar reseñas</h2>
          <p className="text-sm text-gray-600">Envía solicitudes de reseñas a tus clientes.</p>
        </div>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Campañas SMS</h2>
          <p className="text-sm text-gray-600">Crea y lanza campañas de mensajería directa.</p>
        </div>
      </div>

      {/* Chat widget — render when we have a slug or are in pending mode */}
      {(bizSlug || pending) && (
        <AliigoChatWidget businessSlug={bizSlug ?? "horchata-labs"} brand="Aliigo" />
      )}
    </div>
  );
}
