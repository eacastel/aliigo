"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  // auth / identity
  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // editable state
  const [profile, setProfile] = useState<ProfileState>({
    nombre_negocio: "",
    nombre_contacto: "",
    telefono: "",
  });
  const [business, setBusiness] = useState<BusinessState>({
    name: "",
    timezone: "Europe/Madrid",
  });

  // snapshots for "dirty" detection
  const initialProfile = useRef<ProfileState | null>(null);
  const initialBusiness = useRef<BusinessState | null>(null);

  // ui
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---------- load current user + linked business ----------
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id || null;
        setUserId(uid);

        if (!uid) {
          setUnauth(true);
          return;
        }

        // profile (+ business_id)
        const p = await supabase
          .from("business_profiles")
          .select("nombre_negocio,nombre_contacto,telefono,business_id")
          .eq("id", uid)
          .limit(1)
          .maybeSingle();

        if (p.error) {
          setMsg("No se pudo cargar el perfil.");
          return;
        }

        if (!p.data) {
          // No profile row yet (shouldn't happen if /api/profiles/ensure ran) — nudge user
          setMsg("No encontramos tu perfil. Vuelve a iniciar sesión.");
          return;
        }

        setProfile({
          nombre_negocio: p.data.nombre_negocio || "",
          nombre_contacto: p.data.nombre_contacto || "",
          telefono: p.data.telefono || "",
        });
        initialProfile.current = {
          nombre_negocio: p.data.nombre_negocio || "",
          nombre_contacto: p.data.nombre_contacto || "",
          telefono: p.data.telefono || "",
        };

        if (p.data.business_id) {
          setBusinessId(p.data.business_id);
          const b = await supabase
            .from("businesses")
            .select("name,timezone")
            .eq("id", p.data.business_id)
            .limit(1)
            .maybeSingle();

          if (b.error) {
            setMsg("No se pudo cargar el negocio vinculado.");
          } else if (b.data) {
            setBusiness({
              name: b.data.name || "",
              timezone: b.data.timezone || "Europe/Madrid",
            });
            initialBusiness.current = {
              name: b.data.name || "",
              timezone: b.data.timezone || "Europe/Madrid",
            };
          }
        } else {
          // No business linked
          setBusinessId(null);
          initialBusiness.current = { name: "", timezone: "Europe/Madrid" };
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- dirty / valid guards ----------
  const dirty = useMemo(() => {
    const ip = initialProfile.current;
    const ib = initialBusiness.current;
    if (!ip || !ib) return false;
    return (
      profile.nombre_negocio.trim() !== ip.nombre_negocio.trim() ||
      profile.nombre_contacto.trim() !== ip.nombre_contacto.trim() ||
      profile.telefono.trim() !== ip.telefono.trim() ||
      business.name.trim() !== ib.name.trim() ||
      business.timezone.trim() !== ib.timezone.trim()
    );
  }, [profile, business]);

  // Require business.name not blank to allow save
  const valid = useMemo(() => business.name.trim().length > 0, [business.name]);

  // ---------- actions ----------
  const save = async () => {
    setMsg(null);
    if (!userId) {
      setMsg("Debes iniciar sesión.");
      return;
    }
    if (!dirty || !valid) return;

    setSaving(true);
    try {
      const res = await fetch("/api/settings/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // merge-only route ignores blanks; we can safely send the full state
        body: JSON.stringify({ userId, profile, business }),
      });
      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(`Error al guardar: ${j.error || "desconocido"}`);
        return;
      }

      // refresh snapshots so the button disables again
      initialProfile.current = {
        nombre_negocio: profile.nombre_negocio,
        nombre_contacto: profile.nombre_contacto,
        telefono: profile.telefono,
      };
      if (j.business) {
        initialBusiness.current = {
          name: j.business.name || "",
          timezone: j.business.timezone || "Europe/Madrid",
        };
        setBusiness({
          name: j.business.name || "",
          timezone: j.business.timezone || "Europe/Madrid",
        });
      } else {
        initialBusiness.current = { ...business };
      }

      setMsg("Guardado.");
     } catch (_e) {
      setMsg("No se pudo guardar ahora. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const resetToServer = async () => {
    setMsg(null);
    if (!userId) return;
    setLoading(true);
    try {
      const p = await supabase
        .from("business_profiles")
        .select("nombre_negocio,nombre_contacto,telefono,business_id")
        .eq("id", userId)
        .limit(1)
        .maybeSingle();

      if (p.data) {
        setProfile({
          nombre_negocio: p.data.nombre_negocio || "",
          nombre_contacto: p.data.nombre_contacto || "",
          telefono: p.data.telefono || "",
        });
        initialProfile.current = {
          nombre_negocio: p.data.nombre_negocio || "",
          nombre_contacto: p.data.nombre_contacto || "",
          telefono: p.data.telefono || "",
        };

        if (p.data.business_id) {
          const b = await supabase
            .from("businesses")
            .select("name,timezone")
            .eq("id", p.data.business_id)
            .single();

          if (b.data) {
            setBusiness({
              name: b.data.name || "",
              timezone: b.data.timezone || "Europe/Madrid",
            });
            initialBusiness.current = {
              name: b.data.name || "",
              timezone: b.data.timezone || "Europe/Madrid",
            };
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- render ----------
  if (loading) return <p className="p-4 text-sm text-zinc-400">Cargando…</p>;
  if (unauth) {
    return (
      <div className="max-w-lg p-4">
        <h1 className="text-xl font-semibold mb-2 text-white">Necesitas iniciar sesión</h1>
        <p className="text-sm text-zinc-400 mb-4">
          Accede a tu cuenta para editar la configuración del negocio.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-white text-black rounded px-4 py-2"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-lg p-4">
        <h1 className="text-xl font-semibold mb-2 text-white">Sin negocio vinculado</h1>
        <p className="text-sm text-zinc-400">
          No encontramos un negocio asociado a tu perfil. Si acabas de registrarte y confirmaste el
          correo, recarga la página. Si persiste, vuelve a completar el alta.
        </p>
        <button
          onClick={resetToServer}
          className="mt-3 border border-zinc-700 text-white rounded px-4 py-2 hover:bg-zinc-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl text-white">
      <h1 className="text-2xl font-bold mb-4">Business Settings</h1>

      {msg && (
        <div
          className={`mb-4 text-sm ${
            msg.startsWith("Guardado") ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="space-y-8">
        {/* Perfil */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Perfil</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Nombre del negocio (muestra)
              </label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder="Nombre del negocio"
                value={profile.nombre_negocio}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, nombre_negocio: e.target.value }))
                }
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Este campo actualiza tu perfil. El nombre público del negocio vive abajo.
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Nombre de contacto</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder="Nombre de contacto"
                value={profile.nombre_contacto}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, nombre_contacto: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Teléfono</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder="Teléfono"
                value={profile.telefono}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, telefono: e.target.value }))
                }
              />
            </div>
          </div>
        </section>

        {/* Business */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Business</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Public name <span className="text-red-400">*</span>
              </label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder="Public name"
                value={business.name}
                onChange={(e) =>
                  setBusiness((b) => ({ ...b, name: e.target.value }))
                }
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Nombre público que verán tus clientes (no se guardará vacío).
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Timezone</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder="Europe/Madrid"
                value={business.timezone}
                onChange={(e) =>
                  setBusiness((b) => ({ ...b, timezone: e.target.value }))
                }
              />
            </div>
          </div>
        </section>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!dirty || !valid || saving}
            className="bg-white text-black rounded px-4 py-2 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={resetToServer}
            className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
          >
            Deshacer cambios
          </button>
        </div>
      </div>
    </div>
  );
}
