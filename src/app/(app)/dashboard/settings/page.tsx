// src/app/(app)/dashboard/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileState = {
  nombre_negocio: string;
  nombre_contacto: string;
  telefono: string;
};
type BusinessState = {
  name: string;
  timezone: string;
};

export default function SettingsBusinessPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState>({
    nombre_negocio: "",
    nombre_contacto: "",
    telefono: "",
  });
  const [business, setBusiness] = useState<BusinessState>({
    name: "",
    timezone: "Europe/Madrid",
  });
  const [msg, setMsg] = useState<string | null>(null);

  // --- helper: (re)link business if needed using your service-role route
  const ensureLinkedBusiness = async ({
    id,
    nombre_negocio,
    nombre_contacto,
    telefono,
    email,
  }: {
    id: string;
    nombre_negocio: string;
    nombre_contacto: string | null;
    telefono: string | null;
    email: string | null;
  }) => {
    const res = await fetch("/api/profiles/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        nombre_negocio,
        nombre_contacto,
        telefono,
        email,
      }),
    });
    // ignore non-200 here; UI will keep going and show empty fields if failed
    await res.json().catch(() => ({}));
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user?.id || null;
        setUserId(uid);

        if (!uid) {
          setUnauth(true);
          setLoading(false);
          return;
        }

        // 1) Load profile (+ business_id)
        const p = await supabase
          .from("business_profiles")
          .select("nombre_negocio,nombre_contacto,telefono,email,business_id")
          .eq("id", uid)
          .limit(1)
          .maybeSingle();

        if (!p.error && p.data) {
          const {
            nombre_negocio = "",
            nombre_contacto = "",
            telefono = "",
            email = null,
            business_id = null,
          } = p.data as {
            nombre_negocio: string | null;
            nombre_contacto: string | null;
            telefono: string | null;
            email: string | null;
            business_id: string | null;
          };

          setProfile({
            nombre_negocio: nombre_negocio || "",
            nombre_contacto: nombre_contacto || "",
            telefono: telefono || "",
          });

          // 2) If missing link, try to repair via /api/profiles/ensure, then re-fetch
          if (!business_id && nombre_negocio) {
            await ensureLinkedBusiness({
              id: uid,
              nombre_negocio,
              nombre_contacto: nombre_contacto || null,
              telefono: telefono || null,
              email,
            });

            // re-fetch with the same query to get the new business_id
            const p2 = await supabase
              .from("business_profiles")
              .select("business_id")
              .eq("id", uid)
              .limit(1)
              .maybeSingle();

            if (!p2.error && p2.data?.business_id) {
              const b2 = await supabase
                .from("businesses")
                .select("name,timezone")
                .eq("id", p2.data.business_id)
                .limit(1)
                .maybeSingle();
              if (!b2.error && b2.data) {
                setBusiness({
                  name: b2.data.name || "",
                  timezone: b2.data.timezone || "Europe/Madrid",
                });
              }
            }
          } else if (business_id) {
            // 3) If linked, load business public fields
            const b = await supabase
              .from("businesses")
              .select("name,timezone")
              .eq("id", business_id)
              .limit(1)
              .maybeSingle();

            if (!b.error && b.data) {
              setBusiness({
                name: b.data.name || "",
                timezone: b.data.timezone || "Europe/Madrid",
              });
            }
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setMsg(null);
    if (!userId) {
      setMsg("Debes iniciar sesión.");
      return;
    }
    const res = await fetch("/api/settings/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, profile, business }),
    });
    const j = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Guardado." : `Error: ${j.error || "desconocido"}`);
  };

  if (loading) return <p className="p-4">Cargando…</p>;
  if (unauth) {
    return (
      <div className="max-w-lg p-4">
        <h1 className="text-xl font-semibold mb-2">Necesitas iniciar sesión</h1>
        <p className="text-sm text-gray-600 mb-4">
          Accede a tu cuenta para editar la configuración del negocio.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-black text-white rounded px-4 py-2"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Business Settings</h1>

      {msg && <div className="mb-4 text-sm">{msg}</div>}

      <div className="space-y-6">
        <section>
          <h2 className="font-semibold mb-2">Perfil</h2>
          <div className="grid gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Nombre del negocio"
              value={profile.nombre_negocio}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nombre_negocio: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Nombre de contacto"
              value={profile.nombre_contacto}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nombre_contacto: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Teléfono"
              value={profile.telefono}
              onChange={(e) =>
                setProfile((p) => ({ ...p, telefono: e.target.value }))
              }
            />
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Business</h2>
          <div className="grid gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Public name"
              value={business.name}
              onChange={(e) =>
                setBusiness((b) => ({ ...b, name: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Timezone"
              value={business.timezone}
              onChange={(e) =>
                setBusiness((b) => ({ ...b, timezone: e.target.value }))
              }
            />
          </div>
        </section>

        <button onClick={save} className="bg-black text-white rounded px-4 py-2">
          Guardar
        </button>
      </div>
    </div>
  );
}
