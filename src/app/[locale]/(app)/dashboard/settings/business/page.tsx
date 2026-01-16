// src/app/[locale]/(app)/dashboard/settings/business/page.tsx

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
  allowed_domains: string; // textarea (one per line)
  default_locale: "en" | "es";
};

type JoinedBusiness = {
  id?: string | null;
  name: string | null;
  timezone: string | null;
  slug?: string | null;
  allowed_domains?: string[] | null;
  default_locale?: string | null;
} | null;

type ProfileJoinRow = {
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  business_id: string | null;
  businesses: JoinedBusiness;
};

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

function domainsToText(domains: string[] | null | undefined): string {
  return (domains ?? []).join("\n");
}
function textToDomains(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((d, i, a) => a.indexOf(d) === i);
}

export default function SettingsBusinessPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileState>({
    nombre_negocio: "",
    nombre_contacto: "",
    telefono: "",
  });

  const [business, setBusiness] = useState<BusinessState>({
    name: "",
    timezone: "Europe/Madrid",
    allowed_domains: "",
    default_locale: "en",
  });

  const initialProfile = useRef<ProfileState | null>(null);
  const initialBusiness = useRef<BusinessState | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id || null;

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
          businesses:businesses!business_profiles_business_id_fkey (
            id,
            name,
            timezone,
            slug,
            allowed_domains,
            default_locale
          )
        `
        )
        .eq("id", uid)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[settings-business] join error:", error.message);
        setMsg("Could not load your profile.");
        return;
      }
      if (!isProfileJoinRow(data)) {
        setMsg("Profile not found. Please log in again.");
        return;
      }

      const nextProfile: ProfileState = {
        nombre_negocio: data.nombre_negocio ?? "",
        nombre_contacto: data.nombre_contacto ?? "",
        telefono: data.telefono ?? "",
      };
      setProfile(nextProfile);
      initialProfile.current = nextProfile;

      const biz = data.businesses;
      if (data.business_id && biz) {
        setBusinessId(data.business_id);

        const nextBusiness: BusinessState = {
          name: biz.name ?? "",
          timezone: biz.timezone ?? "Europe/Madrid",
          allowed_domains: domainsToText(biz.allowed_domains),
          default_locale: biz.default_locale === "es" ? "es" : "en",
        };

        setBusiness(nextBusiness);
        initialBusiness.current = nextBusiness;
      } else {
        setBusinessId(null);
        const empty: BusinessState = {
          name: "",
          timezone: "Europe/Madrid",
          allowed_domains: "",
          default_locale: "en",
        };
        setBusiness(empty);
        initialBusiness.current = empty;
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      business.timezone.trim() !== ib.timezone.trim() ||
      business.allowed_domains.trim() !== ib.allowed_domains.trim() ||
      business.default_locale !== ib.default_locale
    );
  }, [profile, business]);

  const valid = useMemo(() => business.name.trim().length > 0, [business.name]);

  const save = async () => {
    setMsg(null);
    if (!dirty || !valid) return;

    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;

      if (!token) {
        setMsg("You must be logged in.");
        setUnauth(true);
        return;
      }

      // IMPORTANT: keep assistant fields untouched here
      const payload = {
        profile,
        business: {
          name: business.name,
          timezone: business.timezone,
          allowed_domains: textToDomains(business.allowed_domains),
          default_locale: business.default_locale,
        },
      };

      const res = await fetch("/api/settings/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const j: {
        error?: string;
        business?: {
          name?: string | null;
          timezone?: string | null;
          allowed_domains?: string[] | null;
          default_locale?: string | null;
        };
      } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(`Save error: ${j.error || "unknown"}`);
        return;
      }

      initialProfile.current = { ...profile };

      if (j.business) {
        const nextBusiness: BusinessState = {
          name: j.business.name ?? business.name,
          timezone: j.business.timezone ?? business.timezone,
          allowed_domains: domainsToText(j.business.allowed_domains),
          default_locale:
            j.business.default_locale === "es" ? "es" : business.default_locale,
        };
        initialBusiness.current = nextBusiness;
        setBusiness(nextBusiness);
      } else {
        initialBusiness.current = { ...business };
      }

      setMsg("Saved.");
    } catch (e: unknown) {
      console.error(e);
      setMsg("Could not save now. Try again.");
    } finally {
      setSaving(false);
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
          We didn’t find a business linked to your profile. Reload the page. If
          it persists, try signup again.
        </p>
        <button
          onClick={() => void load()}
          className="mt-3 border border-zinc-700 text-white rounded px-4 py-2 hover:bg-zinc-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl text-white">
      <h1 className="text-2xl font-bold mb-4">Business Settings</h1>

      {msg && (
        <div
          className={`mb-4 text-sm ${
            msg.startsWith("Saved") ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Profile</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Business name (profile)
              </label>
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
              <label className="block text-xs text-zinc-400 mb-1">
                Contact name
              </label>
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

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Default language
              </label>
              <select
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                value={business.default_locale}
                onChange={(e) =>
                  setBusiness((b) => ({
                    ...b,
                    default_locale: e.target.value === "es" ? "es" : "en",
                  }))
                }
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Allowed domains (one per line)
              </label>
              <textarea
                className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder={"example.com\nwww.example.com"}
                value={business.allowed_domains}
                onChange={(e) =>
                  setBusiness((b) => ({ ...b, allowed_domains: e.target.value }))
                }
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Widget requests are accepted only from these hostnames (and subdomains).
              </p>
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
            onClick={() => void load()}
            className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
          >
            Reset changes
          </button>
        </div>
      </div>
    </div>
  );
}
