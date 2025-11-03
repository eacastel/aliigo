"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Types ---------- */
type ProfileState = {
  nombre_negocio: string;
  nombre_contacto: string;
  telefono: string;
};
type BusinessState = {
  name: string;
  timezone: string;
};
type JoinedBusiness = {
  name: string | null;
  timezone: string | null;
  slug?: string | null;
} | null;

type ProfileJoinRow = {
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  business_id: string | null;
  // Supabase embed alias
  businesses: JoinedBusiness;
};

/* Type guard to avoid any */
function isProfileJoinRow(x: unknown): x is ProfileJoinRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    "business_id" in o &&
    "nombre_negocio" in o &&
    "nombre_contacto" in o &&
    "telefono" in o &&
    "businesses" in o
  );
}

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

  // Load profile + linked business with a joined select (no `any`)
  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id || null;
        setUserId(uid);

        if (!uid) {
          setUnauth(true);
          return;
        }

        const { data, error } = await supabase
          .from("business_profiles")
          .select(
            `
            nombre_negocio,
            nombre_contacto,
            telefono,
            business_id,
            businesses:business_id (
              name,
              timezone,
              slug
            )
          `
          )
          .eq("id", uid)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("[settings] profile join error:", error.message);
          setMsg("Could not load your profile.");
          return;
        }
        if (!isProfileJoinRow(data)) {
          setMsg("Profile not found. Please log in again.");
          return;
        }

        // Profile
        const pNombre = data.nombre_negocio ?? "";
        const pContacto = data.nombre_contacto ?? "";
        const pTelefono = data.telefono ?? "";

        setProfile({
          nombre_negocio: pNombre,
          nombre_contacto: pContacto,
          telefono: pTelefono,
        });
        initialProfile.current = {
          nombre_negocio: pNombre,
          nombre_contacto: pContacto,
          telefono: pTelefono,
        };

        // Business (joined)
        const biz = data.businesses;
        if (data.business_id && biz) {
          const bName = biz.name ?? "";
          const bTz = biz.timezone ?? "Europe/Madrid";
          setBusinessId(data.business_id);
          setBusiness({ name: bName, timezone: bTz });
          initialBusiness.current = { name: bName, timezone: bTz };
        } else {
          setBusinessId(null);
          initialBusiness.current = { name: "", timezone: "Europe/Madrid" };
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const valid = useMemo(() => business.name.trim().length > 0, [business.name]);

  const save = async () => {
    setMsg(null);
    if (!userId) {
      setMsg("You must be logged in.");
      return;
    }
    if (!dirty || !valid) return;

    setSaving(true);
    try {
      const res = await fetch("/api/settings/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, profile, business }),
      });
      const j: { error?: string; business?: { name?: string | null; timezone?: string | null } } =
        await res.json().catch(() => ({} as { error?: string }));

      if (!res.ok) {
        setMsg(`Save error: ${j.error || "unknown"}`);
        return;
      }

      initialProfile.current = {
        nombre_negocio: profile.nombre_negocio,
        nombre_contacto: profile.nombre_contacto,
        telefono: profile.telefono,
      };

      if (j.business) {
        const bName = j.business.name ?? "";
        const bTz = j.business.timezone ?? "Europe/Madrid";
        initialBusiness.current = { name: bName, timezone: bTz };
        setBusiness({ name: bName, timezone: bTz });
      } else if (initialBusiness.current) {
        initialBusiness.current = { ...business };
      }

      setMsg("Saved.");
    } catch {
      setMsg("Could not save now. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetToServer = async () => {
    setMsg(null);
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("business_profiles")
        .select(
          `
          nombre_negocio,
          nombre_contacto,
          telefono,
          business_id,
          businesses:business_id (
            name,
            timezone,
            slug
          )
        `
        )
        .eq("id", userId)
        .limit(1)
        .maybeSingle();

      if (!error && isProfileJoinRow(data)) {
        const pNombre = data.nombre_negocio ?? "";
        const pContacto = data.nombre_contacto ?? "";
        const pTelefono = data.telefono ?? "";

        setProfile({
          nombre_negocio: pNombre,
          nombre_contacto: pContacto,
          telefono: pTelefono,
        });
        initialProfile.current = {
          nombre_negocio: pNombre,
          nombre_contacto: pContacto,
          telefono: pTelefono,
        };

        const biz = data.businesses;
        if (data.business_id && biz) {
          const bName = biz.name ?? "";
          const bTz = biz.timezone ?? "Europe/Madrid";
          setBusiness({ name: bName, timezone: bTz });
          initialBusiness.current = { name: bName, timezone: bTz };
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-zinc-400">Cargando…</p>;
  if (unauth) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">Login required</h1>
        <p className="text-sm text-zinc-400 mb-4">
          Please sign in to edit business settings.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-white text-black rounded px-4 py-2"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">No linked business</h1>
        <p className="text-sm text-zinc-400">
          We didn’t find a business linked to your profile. If you just signed up,
          reload the page. If it persists, try the signup again.
        </p>
        <button
          onClick={resetToServer}
          className="mt-3 border border-zinc-700 text-white rounded px-4 py-2 hover:bg-zinc-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl text-white">
      <h1 className="text-2xl font-bold mb-4">Business Settings</h1>

      {msg && (
        <div className={`mb-4 text-sm ${msg.startsWith("Saved") ? "text-green-400" : "text-red-400"}`}>
          {msg}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Profile</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Business name (profile)</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder="Business name"
                value={profile.nombre_negocio}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, nombre_negocio: e.target.value }))
                }
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                This updates your profile’s display. Public name lives below.
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Contact name</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder="Contact name"
                value={profile.nombre_contacto}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, nombre_contacto: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Phone</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder="Phone"
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
              <p className="text-[11px] text-zinc-500 mt-1">Must not be blank when saving.</p>
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
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={resetToServer}
            className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
          >
            Reset changes
          </button>
        </div>
      </div>
    </div>
  );
}
