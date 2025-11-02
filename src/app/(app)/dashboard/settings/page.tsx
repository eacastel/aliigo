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

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id || null;
        setUserId(uid);

        if (!uid) {
          // No session: stop spinner and show unauth UI (or redirect)
          setUnauth(true);
          setLoading(false);
          return;
        }

        // Load profile (+ business_id)
        const p = await supabase
          .from("business_profiles")
          .select("nombre_negocio,nombre_contacto,telefono,business_id")
          .eq("id", uid)
          .limit(1)
          .maybeSingle();

        if (p.data) {
          setProfile({
            nombre_negocio: p.data.nombre_negocio || "",
            nombre_contacto: p.data.nombre_contacto || "",
            telefono: p.data.telefono || "",
          });

          // If linked, load business public fields
          if (p.data.business_id) {
            const b = await supabase
              .from("businesses")
              .select("name,timezone")
              .eq("id", p.data.business_id)
              .limit(1)
              .maybeSingle();

            if (b.data) {
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
