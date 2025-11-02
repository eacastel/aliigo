"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileState = {
  nombre_negocio: string;
  nombre_contacto: string;
  telefono: string;
  email?: string;
};
type BusinessState = {
  name: string;
  timezone: string;
};

function trimOrEmpty(v: unknown) {
  return (typeof v === "string" ? v.trim() : "") || "";
}
function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>) {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export default function SettingsBusinessPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // live state
  const [profile, setProfile] = useState<ProfileState>({
    nombre_negocio: "",
    nombre_contacto: "",
    telefono: "",
    email: "",
  });
  const [business, setBusiness] = useState<BusinessState>({
    name: "",
    timezone: "Europe/Madrid",
  });

  // initial (for dirty check)
  const [initialProfile, setInitialProfile] = useState<ProfileState | null>(null);
  const [initialBusiness, setInitialBusiness] = useState<BusinessState | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

        // Load profile (+ business_id)
        const p = await supabase
          .from("business_profiles")
          .select("nombre_negocio,nombre_contacto,telefono,email,business_id")
          .eq("id", uid)
          .limit(1)
          .maybeSingle();

        const loadedProfile: ProfileState = {
          nombre_negocio: trimOrEmpty(p.data?.nombre_negocio),
          nombre_contacto: trimOrEmpty(p.data?.nombre_contacto),
          telefono: trimOrEmpty(p.data?.telefono),
          email: trimOrEmpty(p.data?.email),
        };
        setProfile(loadedProfile);
        setInitialProfile(loadedProfile);

        if (p.data?.business_id) {
          const b = await supabase
            .from("businesses")
            .select("name,timezone")
            .eq("id", p.data.business_id)
            .limit(1)
            .maybeSingle();

          const loadedBusiness: BusinessState = {
            name: trimOrEmpty(b.data?.name) || trimOrEmpty(p.data?.nombre_negocio), // fallback to profile name
            timezone: trimOrEmpty(b.data?.timezone) || "Europe/Madrid",
          };
          setBusiness(loadedBusiness);
          setInitialBusiness(loadedBusiness);
        } else {
          // no link yet—show profile values as defaults
          const fallbackBusiness: BusinessState = {
            name: loadedProfile.nombre_negocio,
            timezone: "Europe/Madrid",
          };
          setBusiness(fallbackBusiness);
          setInitialBusiness(fallbackBusiness);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dirty = useMemo(() => {
    if (!initialProfile || !initialBusiness) return false;
    return (
      !shallowEqual(profile, initialProfile) ||
      !shallowEqual(business, initialBusiness)
    );
  }, [profile, business, initialProfile, initialBusiness]);

  const invalid = useMemo(() => {
    // lightweight validation: prevent empty business name
    return !business.name.trim() && !profile.nombre_negocio.trim();
  }, [business.name, profile.nombre_negocio]);

  const save = async () => {
    setMsg(null);
    if (!userId) {
      setMsg("You must be logged in.");
      return;
    }
    if (!dirty) {
      setMsg("No changes to save.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, profile, business }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("Saved.");
        // refresh initial snapshots so Save disables again
        setInitialProfile(profile);
        setInitialBusiness(business);
      } else {
        setMsg(`Error: ${j.error || "unknown"}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4">Cargando…</p>;
  if (unauth) {
    return (
      <div className="max-w-lg p-4">
        <h1 className="text-xl font-semibold mb-2">You need to log in</h1>
        <button
          onClick={() => router.push("/login")}
          className="bg-black text-white rounded px-4 py-2"
        >
          Log in
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
          <h2 className="font-semibold mb-2">Profile</h2>
          <div className="grid gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Business name"
              value={profile.nombre_negocio}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nombre_negocio: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Contact name"
              value={profile.nombre_contacto}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nombre_contacto: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Phone"
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

        <button
          onClick={save}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={!dirty || invalid || saving}
          title={
            invalid
              ? "Business name can’t be empty"
              : !dirty
              ? "No changes"
              : undefined
          }
        >
          {saving ? "Saving…" : "Save"}
        </button>

        <p className="text-xs text-gray-500">
          Empty fields will be ignored on save (won’t overwrite existing values).
        </p>
      </div>
    </div>
  );
}
