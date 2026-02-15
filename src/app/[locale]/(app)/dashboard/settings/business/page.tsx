// src/app/[locale]/(app)/dashboard/settings/business/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";
import { useBillingGate } from "@/components/BillingGateContext";

/* ---------- Types ---------- */
type ProfileState = {
  nombre_negocio: string;
  nombre_contacto: string;
  telefono: string;
};

type BusinessState = {
  name: string;
  timezone: string;
  allowed_domains_text: string;
  default_locale: "en" | "es";
};

type JoinedBusiness = {
  id?: string | null;
  name: string | null;
  timezone: string | null;
  slug?: string | null;
  allowed_domains?: string[] | null;
  domain_limit?: number | null;
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

function normalizeDomainInput(value: string): string | null {
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  let host = raw;
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      host = new URL(raw).hostname.toLowerCase();
    }
  } catch {
    host = raw;
  }
  host = host.split("/")[0].split(":")[0].trim();
  if (host.startsWith("www.")) host = host.slice(4);
  if (host === "localhost" || host === "127.0.0.1") return host;
  if (!host || !host.includes(".")) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  if (host.startsWith(".") || host.endsWith(".") || host.includes("..")) return null;
  return host;
}

function domainsToBaseText(domains: string[] | null | undefined): string {
  const list = (domains ?? []).filter(Boolean);
  const normalized = list
    .map((d) => (typeof d === "string" ? d.trim().toLowerCase() : ""))
    .filter(Boolean);

  const bases = new Set<string>();
  for (const d of normalized) {
    if (d === "localhost" || d === "127.0.0.1") {
      bases.add("localhost");
      continue;
    }
    if (d.startsWith("www.") && normalized.includes(d.slice(4))) continue;
    bases.add(d.startsWith("www.") ? d.slice(4) : d);
  }
  return Array.from(bases).join("\n");
}

export default function SettingsBusinessPage() {
  const router = useRouter();
  const t = useTranslations("DashboardBusiness");
  const billingGate = useBillingGate();
  const domainLocked = billingGate.status === "inactive";

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
    allowed_domains_text: "",
    default_locale: "en",
  });
  const [domainLimit, setDomainLimit] = useState<number>(1);

  const initialProfile = useRef<ProfileState | null>(null);
  const initialBusiness = useRef<BusinessState | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

    // --- UI parity with Billing + Messages buttons ---
      const btnBase =
        "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors !cursor-pointer disabled:opacity-60 disabled:!cursor-not-allowed";

      const btnBrand =
        `${btnBase} bg-brand-500/10 text-brand-200 ring-brand-500/25 hover:bg-brand-500/15`;

      const btnNeutral =
        `${btnBase} bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40`;

      const btnNeutralStrong =
        `${btnBase} bg-zinc-950/40 text-zinc-200 ring-zinc-700/60 hover:bg-zinc-900/50`;


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
            domain_limit,
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
          allowed_domains_text: domainsToBaseText(biz.allowed_domains),
          default_locale: biz.default_locale === "es" ? "es" : "en",
        };
        setDomainLimit(typeof biz.domain_limit === "number" && biz.domain_limit > 0 ? biz.domain_limit : 1);

        setBusiness(nextBusiness);
        initialBusiness.current = nextBusiness;
      } else {
        setBusinessId(null);
        const empty: BusinessState = {
          name: "",
          timezone: "Europe/Madrid",
          allowed_domains_text: "",
          default_locale: "en",
        };
        setDomainLimit(1);
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
      business.allowed_domains_text.trim() !== ib.allowed_domains_text.trim() ||
      business.default_locale !== ib.default_locale
    );
  }, [profile, business]);

  const parsedDomainState = useMemo(() => {
    const rawLines = business.allowed_domains_text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const invalidLines: string[] = [];
    const bases = new Set<string>();

    for (const line of rawLines) {
      const normalized = normalizeDomainInput(line);
      if (!normalized) {
        invalidLines.push(line);
        continue;
      }
      bases.add(normalized);
    }

    const baseDomains = Array.from(bases);
    const expanded = new Set<string>();
    for (const base of baseDomains) {
      if (base === "localhost") {
        expanded.add("localhost");
        expanded.add("127.0.0.1");
      } else if (base === "127.0.0.1") {
        expanded.add("127.0.0.1");
        expanded.add("localhost");
      } else {
        expanded.add(base);
        expanded.add(`www.${base}`);
      }
    }

    return {
      baseDomains,
      expandedDomains: Array.from(expanded),
      invalidLines,
      exceedsLimit: baseDomains.length > domainLimit,
    };
  }, [business.allowed_domains_text, domainLimit]);

  const domainInputRows = useMemo(() => {
    const rows = business.allowed_domains_text.split("\n");
    const trimmed = rows.map((r) => r.trim());
    const fixed = trimmed.slice(0, domainLimit);
    while (fixed.length < domainLimit) fixed.push("");
    return fixed;
  }, [business.allowed_domains_text, domainLimit]);

  const domainInvalid = parsedDomainState.invalidLines.length > 0 || parsedDomainState.exceedsLimit;
  const valid = useMemo(
    () => business.name.trim().length > 0 && !domainInvalid,
    [business.name, domainInvalid]
  );

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
          allowed_domains: parsedDomainState.baseDomains,
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
          allowed_domains_text: domainsToBaseText(j.business.allowed_domains),
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
          className={btnBrand}
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
          className={`mt-3 ${btnNeutral}`}
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
                {t("domains.label")}
              </label>
              <div className="space-y-2">
                {domainInputRows.map((value, idx) => (
                  <input
                    key={idx}
                    className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder={t("domains.placeholder")}
                    value={value}
                    onChange={(e) => {
                      const next = [...domainInputRows];
                      next[idx] = e.target.value;
                      const normalizedText = next.join("\n").replace(/\n+$/, "");
                      setBusiness((b) => ({ ...b, allowed_domains_text: normalizedText }));
                    }}
                    disabled={domainLocked}
                    spellCheck={false}
                  />
                ))}
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                {t("domains.help")}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {t("domains.limit", { count: domainLimit })}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {t("domains.used", {
                  used: parsedDomainState.baseDomains.length,
                  count: domainLimit,
                })}
              </p>
              {domainLocked && (
                <p className="text-[11px] text-amber-400 mt-1">
                  {t("domains.locked")}
                </p>
              )}
              {domainInvalid && (
                <p className="text-[11px] text-red-400 mt-1">
                  {parsedDomainState.exceedsLimit
                    ? t("domains.limitExceeded", { count: domainLimit })
                    : t("domains.invalid")}
                </p>
              )}
              <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-300">
                <div className="text-[11px] text-zinc-500 mb-1">
                  {t("domains.previewLabel")}
                </div>
                {parsedDomainState.expandedDomains.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedDomainState.expandedDomains.map((d) => (
                      <span
                        key={d}
                        className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[11px]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500">
                    {t("domains.previewEmpty")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!dirty || !valid || saving}
            className={btnBrand}

          >
            {saving ? "Saving…" : "Save"}
          </button>

          <button
            onClick={() => void load()}
            className={btnNeutral}
          >
            Reset changes
          </button>
        </div>
      </div>
    </div>
  );
}
