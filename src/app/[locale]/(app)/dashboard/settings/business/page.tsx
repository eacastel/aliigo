// src/app/[locale]/(app)/dashboard/settings/business/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLocale, useTranslations } from "next-intl";
import { useBillingGate } from "@/components/BillingGateContext";
import LoadingState from "@/components/ui/LoadingState";
import EntitlementPill from "@/components/ui/EntitlementPill";
import {
  domainLimitForPlan,
  effectivePlanForEntitlements,
  isTrialActive,
  localeLimitForPlan,
  normalizePlan,
} from "@/lib/effectivePlan";

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
  enabled_locales: ("en" | "es")[];
};

type JoinedBusiness = {
  id?: string | null;
  name: string | null;
  timezone: string | null;
  slug?: string | null;
  allowed_domains?: string[] | null;
  domain_limit?: number | null;
  default_locale?: string | null;
  enabled_locales?: string[] | null;
  billing_plan?: string | null;
  billing_status?: "incomplete" | "trialing" | "active" | "canceled" | "past_due" | null;
  trial_end?: string | null;
} | null;

type ProfileJoinRow = {
  email: string | null;
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
  const locale = useLocale();
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
    enabled_locales: ["en"],
  });
  const [domainLimit, setDomainLimit] = useState<number>(1);
  const [billingPlan, setBillingPlan] = useState<string>("basic");
  const [isProTrial, setIsProTrial] = useState(false);

  const initialProfile = useRef<ProfileState | null>(null);
  const initialBusiness = useRef<BusinessState | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingEmailExpiresAt, setPendingEmailExpiresAt] = useState<string | null>(null);

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

      const { data: sess2 } = await supabase.auth.getSession();
      const token = sess2.session?.access_token;
      if (token) {
        const pendingRes = await fetch("/api/settings/business/email-change", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const pendingJson = (await pendingRes.json().catch(() => ({}))) as {
          ok?: boolean;
          pendingEmail?: string | null;
          expiresAt?: string | null;
        };
        if (pendingRes.ok && pendingJson.ok) {
          setPendingEmail(pendingJson.pendingEmail ?? null);
          setPendingEmailExpiresAt(pendingJson.expiresAt ?? null);
        }
      }

      const { data, error } = await supabase
        .from("business_profiles")
        .select(
          `
          nombre_negocio,
          nombre_contacto,
          telefono,
          email,
          business_id,
          businesses:businesses!business_profiles_business_id_fkey (
            id,
            name,
            timezone,
            slug,
            allowed_domains,
            domain_limit,
            default_locale,
            enabled_locales,
            billing_plan,
            billing_status,
            trial_end
          )
        `
        )
        .eq("id", uid)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[settings-business] join error:", error.message);
        setMsg(t("status.loadError"));
        return;
      }
      if (!isProfileJoinRow(data)) {
        setMsg(t("status.profileNotFound"));
        return;
      }

      const nextProfile: ProfileState = {
        nombre_negocio: data.nombre_negocio ?? "",
        nombre_contacto: data.nombre_contacto ?? "",
        telefono: data.telefono ?? "",
      };
      setCurrentEmail(data.email ?? "");
      setNewEmail("");
      setEmailMsg(null);
      setProfile(nextProfile);
      initialProfile.current = nextProfile;

      const biz = data.businesses;
      if (data.business_id && biz) {
        setBusinessId(data.business_id);
        const rawPlan = normalizePlan(biz.billing_plan || "basic");
        const trialActive = isTrialActive(biz.billing_status ?? null, biz.trial_end ?? null);
        const nextPlan = effectivePlanForEntitlements({
          billingPlan: biz.billing_plan,
          billingStatus: biz.billing_status,
          trialEnd: biz.trial_end,
        });
        setIsProTrial(
          trialActive &&
            (rawPlan === "basic" || rawPlan === "starter" || rawPlan === "growth")
        );
        const planLocaleLimit = localeLimitForPlan(nextPlan);
        const fallbackDefault = biz.default_locale === "es" ? "es" : "en";
        const hydratedLocales = (() => {
          const langs = Array.isArray(biz.enabled_locales)
            ? Array.from(
                new Set(
                  biz.enabled_locales
                    .map((l) => (String(l).toLowerCase().startsWith("es") ? "es" : "en"))
                )
              )
            : [];
          if (!langs.length) langs.push(fallbackDefault);
          if (!langs.includes(fallbackDefault)) langs.push(fallbackDefault);
          if (planLocaleLimit === 1) return [fallbackDefault] as ("en" | "es")[];
          return langs.slice(0, planLocaleLimit) as ("en" | "es")[];
        })();

      const nextBusiness: BusinessState = {
          name: biz.name ?? "",
          timezone: biz.timezone ?? "Europe/Madrid",
          allowed_domains_text: domainsToBaseText(biz.allowed_domains),
          default_locale: fallbackDefault,
          enabled_locales: hydratedLocales,
        };
        const planDomainLimit = domainLimitForPlan(nextPlan);
        const effectiveDomainLimit =
          typeof biz.domain_limit === "number" && biz.domain_limit > 0
            ? Math.min(biz.domain_limit, planDomainLimit)
            : planDomainLimit;
        setDomainLimit(effectiveDomainLimit);
        setBillingPlan(nextPlan);

        setBusiness(nextBusiness);
        initialBusiness.current = nextBusiness;
      } else {
        setBusinessId(null);
        const empty: BusinessState = {
          name: "",
          timezone: "Europe/Madrid",
          allowed_domains_text: "",
          default_locale: "en",
          enabled_locales: ["en"],
        };
        setDomainLimit(1);
        setBillingPlan("basic");
        setIsProTrial(false);
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
      business.default_locale !== ib.default_locale ||
      [...business.enabled_locales].sort().join(",") !==
        [...ib.enabled_locales].sort().join(",")
    );
  }, [profile, business]);

  const localeLimit = useMemo(() => localeLimitForPlan(billingPlan), [billingPlan]);

  const localeOptions: Array<{ code: "en" | "es"; label: string }> = [
    { code: "en", label: t("languages.english") },
    { code: "es", label: t("languages.spanish") },
  ];

  const toggleEnabledLocale = (localeCode: "en" | "es") => {
    setBusiness((prev) => {
      const hasLocale = prev.enabled_locales.includes(localeCode);
      let next = [...prev.enabled_locales];
      if (hasLocale) {
        if (next.length <= 1) return prev;
        next = next.filter((l) => l !== localeCode);
      } else {
        if (localeLimit === 1) {
          next = [localeCode];
        } else {
          if (next.length >= localeLimit) return prev;
          next.push(localeCode);
        }
      }
      if (!next.includes(prev.default_locale)) {
        return {
          ...prev,
          enabled_locales: next,
          default_locale: next[0] ?? "en",
        };
      }
      return { ...prev, enabled_locales: next };
    });
  };

  const setDefaultLocale = (localeCode: "en" | "es") => {
    setBusiness((prev) => {
      if (!prev.enabled_locales.includes(localeCode)) return prev;
      return { ...prev, default_locale: localeCode };
    });
  };

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
        setMsg(t("status.mustLogin"));
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
          enabled_locales: business.enabled_locales,
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
          enabled_locales?: string[] | null;
        };
      } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(t("status.saveError", { error: j.error || "unknown" }));
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
          enabled_locales: (() => {
            const langs = Array.isArray(j.business.enabled_locales)
              ? Array.from(
                  new Set(
                    j.business.enabled_locales
                      .map((l) => (String(l).toLowerCase().startsWith("es") ? "es" : "en"))
                  )
                )
              : [];
            if (!langs.length) langs.push(j.business.default_locale === "es" ? "es" : "en");
            return langs as ("en" | "es")[];
          })(),
        };
        initialBusiness.current = nextBusiness;
        setBusiness(nextBusiness);
      } else {
        initialBusiness.current = { ...business };
      }

      setMsg(t("status.saved"));
    } catch (e: unknown) {
      console.error(e);
      setMsg(t("status.saveRetry"));
    } finally {
      setSaving(false);
    }
  };

  const sendEmailChangeRequest = async () => {
    setEmailMsg(null);
    const target = newEmail.trim().toLowerCase();
    if (!target || !target.includes("@")) {
      setEmailMsg(t("emailChange.errorInvalid"));
      return;
    }
    if (target === currentEmail.trim().toLowerCase()) {
      setEmailMsg(t("emailChange.errorUnchanged"));
      return;
    }

    setEmailSending(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setEmailMsg(t("status.mustLogin"));
        return;
      }

      const res = await fetch("/api/settings/business/email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: target, locale }),
      });

      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !j.ok) {
        setEmailMsg(
          t("emailChange.errorGeneric", {
            error: j.error ?? "unknown",
          })
        );
        return;
      }

      setEmailMsg(t("emailChange.success", { email: target }));
      setPendingEmail(target);
      setNewEmail("");
      void load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown";
      setEmailMsg(t("emailChange.errorGeneric", { error: message }));
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) return <LoadingState label={t("status.loading")} className="p-4" />;

  if (unauth) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">{t("auth.loginRequiredTitle")}</h1>
        <p className="text-sm text-zinc-400 mb-4">
          {t("auth.loginRequiredDescription")}
        </p>
        <button
          onClick={() => router.push("/login")}
          className={btnBrand}
        >
          {t("auth.signIn")}
        </button>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">{t("auth.noBusinessTitle")}</h1>
        <p className="text-sm text-zinc-400">
          {t("auth.noBusinessDescription")}
        </p>
        <button
          onClick={() => void load()}
          className={`mt-3 ${btnNeutral}`}
        >
          {t("actions.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl text-white">
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      {isProTrial ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: "lab(55% -12.85 3.72)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <EntitlementPill label={t("badges.proPlus")} href="/dashboard/billing" />
            <span>{t("trialHint")}</span>
          </div>
        </div>
      ) : null}

      {msg && (
        <div
          className={`mb-4 text-sm ${
            msg === t("status.saved") ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">{t("sections.profile")}</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {t("fields.profileBusinessName.label")}
              </label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder={t("fields.profileBusinessName.placeholder")}
                value={profile.nombre_negocio}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, nombre_negocio: e.target.value }))
                }
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                {t("fields.profileBusinessName.help")}
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {t("fields.contactName.label")}
              </label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder={t("fields.contactName.placeholder")}
                value={profile.nombre_contacto}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, nombre_contacto: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">{t("fields.phone.label")}</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder={t("fields.phone.placeholder")}
                value={profile.telefono}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, telefono: e.target.value }))
                }
              />
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <label className="block text-xs text-zinc-400 mb-1">
                {t("emailChange.currentLabel")}
              </label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm text-zinc-300"
                value={currentEmail}
                readOnly
              />
              <label className="block text-xs text-zinc-400 mb-1 mt-3">
                {t("emailChange.newLabel")}
              </label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder={t("emailChange.newPlaceholder")}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <p className="text-[11px] text-zinc-500 mt-2">{t("emailChange.help")}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={sendEmailChangeRequest}
                  disabled={emailSending}
                  className={btnNeutralStrong}
                >
                  {emailSending ? t("emailChange.sending") : t("emailChange.sendButton")}
                </button>
                {emailMsg && (
                  <span
                    className={`text-xs ${
                      emailMsg.includes("sent") || emailMsg.includes("enviado")
                        ? "text-green-400"
                        : "text-zinc-300"
                    }`}
                  >
                    {emailMsg}
                  </span>
                )}
              </div>
              {pendingEmail && (
                <p className="text-[11px] text-amber-300 mt-2">
                  {t("emailChange.pending", {
                    email: pendingEmail,
                    expiresAt: pendingEmailExpiresAt
                      ? new Intl.DateTimeFormat(locale, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(pendingEmailExpiresAt))
                      : "—",
                  })}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Business */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">{t("sections.business")}</h2>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {t("fields.publicName.label")} <span className="text-red-400">*</span>
              </label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder={t("fields.publicName.placeholder")}
                value={business.name}
                onChange={(e) =>
                  setBusiness((b) => ({ ...b, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">{t("fields.timezone.label")}</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                placeholder={t("fields.timezone.placeholder")}
                value={business.timezone}
                onChange={(e) =>
                  setBusiness((b) => ({ ...b, timezone: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                <span className="inline-flex items-center gap-2">
                  {t("languages.label")}
                  <EntitlementPill label={t("badges.growthPlus")} href="/dashboard/billing" />
                </span>
              </label>
              <p className="text-[11px] mt-1" style={{ color: "lab(55% -12.85 3.72)" }}>
                {t("languages.featureHelp")}
              </p>
              <div className="flex flex-wrap gap-2">
                {localeOptions.map((opt) => {
                  const checked = business.enabled_locales.includes(opt.code);
                  const blockAdd =
                    !checked && localeLimit !== 1 && business.enabled_locales.length >= localeLimit;
                  const disabled = (checked && business.enabled_locales.length === 1) || blockAdd;
                  const isDefault = business.default_locale === opt.code;
                  return (
                    <div
                      key={opt.code}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        checked
                          ? "border-brand-600/50 bg-brand-500/10 text-brand-100"
                          : "border-zinc-800 bg-zinc-950 text-zinc-300"
                      } ${disabled ? "opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEnabledLocale(opt.code)}
                        disabled={disabled}
                        className="accent-emerald-500"
                      />
                      <span>{opt.label}</span>
                      {checked ? (
                        <button
                          type="button"
                          onClick={() => setDefaultLocale(opt.code)}
                          className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300"
                          style={isDefault ? { color: "lab(55% -12.85 3.72)", borderColor: "lab(55% -12.85 3.72 / 0.55)" } : undefined}
                        >
                          {isDefault ? t("languages.defaultActive") : t("languages.setDefaultAction")}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                {t("languages.defaultHelp")}
              </p>
              <p className="text-[11px] text-zinc-500 mt-2">
                {t("languages.limit", {
                  count:
                    localeLimit === Number.MAX_SAFE_INTEGER
                      ? t("languages.unlimited")
                      : String(localeLimit),
                })}
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                <span className="inline-flex items-center gap-2">
                  {t("domains.label")}
                  <EntitlementPill label={t("badges.proPlus")} href="/dashboard/billing" />
                </span>
              </label>
              <p className="text-[11px] mt-1" style={{ color: "lab(55% -12.85 3.72)" }}>
                {t("domains.featureHelp")}
              </p>
              <div className="space-y-2">
                {domainInputRows.map((value, idx) => (
                  <input
                    key={idx}
                    className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder={
                      idx === 0
                        ? t("domains.placeholderFirst")
                        : idx === 1
                          ? t("domains.placeholderSecond")
                          : idx === 2
                            ? t("domains.placeholderThird")
                            : t("domains.placeholder")
                    }
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
            {saving ? t("actions.saving") : t("actions.save")}
          </button>

          <button
            onClick={() => void load()}
            className={btnNeutral}
          >
            {t("actions.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
