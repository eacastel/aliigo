// src/app/(app)/dashboard/widget/page.tsx
"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useBillingGate } from "@/components/BillingGateContext";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import LoadingState from "@/components/ui/LoadingState";
import EntitlementPill from "@/components/ui/EntitlementPill";
import {
  effectivePlanForEntitlements,
  isGrowthOrHigher,
  isTrialActive,
  normalizePlan,
} from "@/lib/effectivePlan";

type Theme = {
  headerBg: string;
  headerText: string;
  bubbleUser: string;
  bubbleBot: string;
  sendBg: string;
  sendText: string;
  panelBg: string;   
  panelOpacity: number;   
  headerLogoUrl: string;
  showBranding: boolean;
  widgetLive: boolean;
};

type ThemeDb = Partial<Theme>;

type BizLocal = {
  id: string;
  slug: string;
  public_embed_key: string;
  default_locale: "en" | "es";
  billing_plan: string | null;
  widget_theme: ThemeDb;
};

type WidgetJoinRow = {
  business_id: string | null;
  businesses: {
    id: string;
    slug: string;
    public_embed_key: string | null;
    default_locale: string | null;
    widget_theme: ThemeDb | null;
  } | null;
};

function isWidgetJoinRow(x: unknown): x is WidgetJoinRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return "business_id" in o && "businesses" in o;
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com";
}

const isHex = (v?: string) =>
  typeof v === "string" && /^#([0-9a-fA-F]{3}){1,2}$/.test(v.trim());

const normalizeHex = (v: string) => v.trim();

// For strings that contain 1–2 hex values, returns bg + text.
// Example: "#111827 #ffffff" -> { bg:"#111827", text:"#ffffff" }
const splitTwoHex = (v?: string) => {
  const s = (v || "").trim();
  if (!s) return { bg: "", text: "" };

  // Accept partial tokens while typing (no regex)
  const parts = s.split(/\s+/);
  return {
    bg: parts[0] ?? "",
    text: parts[1] ?? "",
  };
};

  // --- UI parity with Billing + Messages buttons ---
  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors !cursor-pointer disabled:opacity-45 disabled:!cursor-not-allowed disabled:pointer-events-none";

  const btnBrand =
    `${btnBase} bg-brand-500/10 text-brand-200 ring-brand-500/25 hover:bg-brand-500/15`;

  const btnNeutral =
    `${btnBase} bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40`;

  const btnNeutralStrong =
    `${btnBase} bg-zinc-950/40 text-zinc-200 ring-zinc-700/60 hover:bg-zinc-900/50`;



const joinTwoHex = (bg: string, text: string) =>
  `${normalizeHex(bg)} ${normalizeHex(text)}`.trim();

const DEFAULT_THEME: Theme = {
  headerBg: "#111827 #ffffff", // bg + text
  headerText: "#ffffff", // kept for backwards compat, not used by new UI
  bubbleUser: "#2563eb #ffffff", // bg + text
  bubbleBot: "#f3f4f6 #111827", // bg + text
  sendBg: "#2563eb #ffffff", // bg + text
  sendText: "#ffffff", // kept for backwards compat, not used by new UI
  panelBg: "#09090b",
  panelOpacity: 0.72,
  headerLogoUrl: "",
  showBranding: false,
  widgetLive: true,
};

function mergeTheme(db: ThemeDb | null | undefined): Theme {
  return { ...DEFAULT_THEME, ...(db ?? {}) };
}

function toThemeDb(x: unknown): ThemeDb | undefined {
  if (!x || typeof x !== "object") return undefined;

  const o = x as Record<string, unknown>;
  const out: ThemeDb = {};

  if (typeof o.headerBg === "string") out.headerBg = o.headerBg;
  if (typeof o.headerText === "string") out.headerText = o.headerText;
  if (typeof o.bubbleUser === "string") out.bubbleUser = o.bubbleUser;
  if (typeof o.bubbleBot === "string") out.bubbleBot = o.bubbleBot;
  if (typeof o.sendBg === "string") out.sendBg = o.sendBg;
  if (typeof o.sendText === "string") out.sendText = o.sendText;
  if (typeof o.panelBg === "string") out.panelBg = o.panelBg;
  if (typeof o.panelOpacity === "number") out.panelOpacity = o.panelOpacity;
  if (typeof o.headerLogoUrl === "string") out.headerLogoUrl = o.headerLogoUrl;
  if (typeof o.showBranding === "boolean") out.showBranding = o.showBranding;
  if (typeof o.widgetLive === "boolean") out.widgetLive = o.widgetLive;


  return out;
}

type PostgrestErrLike = { message?: string } | null;

function errMsg(e: PostgrestErrLike): string {
  return typeof e?.message === "string" ? e.message : "";
}

// Small helper to keep inputs valid: if empty or invalid, return "" (so user can type)
function safeHex(v: string) {
  const s = v.trim();

  // allow empty so user can clear the field
  if (!s) return "";

  // allow typing partial: "#", "#1", "#12", "#123", "#1234"... etc
  if (s[0] !== "#") return s; // don’t block if they paste without '#', you can enforce later
  const rest = s.slice(1).replace(/[^0-9a-fA-F]/g, "");
  return "#" + rest.slice(0, 6);
}

function toColorPickerValue(v: string, fallback: string): string {
  const s = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function HexInput({
  value,
  onChange,
  fallback = "#000000",
}: {
  value: string;
  onChange: (next: string) => void;
  fallback?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="h-10 w-10 cursor-pointer rounded border border-zinc-800 bg-zinc-950 p-1"
        value={toColorPickerValue(value, fallback)}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Color picker"
      />
      <input
        className="w-full border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
        value={value}
        placeholder="#RRGGBB"
        onChange={(e) => onChange(safeHex(e.target.value))}
      />
    </div>
  );
}

export default function WidgetSettingsPage() {
  const t = useTranslations("DashboardWidget");
  const billingGate = useBillingGate();
  const widgetLocked = billingGate.status === "inactive";
  const [loading, setLoading] = useState(true);
  const [biz, setBiz] = useState<BizLocal | null>(null);

  const [brand, setBrand] = useState("Aliigo");

  const [initialBrand, setInitialBrand] = useState("Aliigo");

  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [initialTheme, setInitialTheme] = useState<Theme>(DEFAULT_THEME);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [previewSessionToken, setPreviewSessionToken] = useState<string | null>(null);
  const [previewLocale, setPreviewLocale] = useState<"en" | "es">("en");
  const [previewShowBranding, setPreviewShowBranding] = useState(false);
  const [previewShowHeaderIcon, setPreviewShowHeaderIcon] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoMsg, setLogoMsg] = useState<string | null>(null);
  const [billingPlan, setBillingPlan] = useState<string>("basic");
  const [isProTrial, setIsProTrial] = useState(false);
  const [installStatus, setInstallStatus] = useState<{
    installed: boolean;
    activeDomainHost: string | null;
    lastSeenAt: string | null;
  } | null>(null);

  const isBasicPlan = billingPlan === "basic" || billingPlan === "starter";
  const canToggleBranding = !isBasicPlan;
  const canManageHeaderLogo = isGrowthOrHigher(billingPlan);

  type BizRow = {
    id: string;
    slug: string;
    name: string | null;
    brand_name: string | null;
    public_embed_key: string | null;
    default_locale: string | null;
    billing_plan: string | null;
    billing_status?: "incomplete" | "trialing" | "active" | "canceled" | "past_due" | null;
    trial_end?: string | null;
    widget_theme?: unknown;
  };

  type JoinRow = {
    business_id: string | null;
    businesses: BizRow | null;
  };

  useEffect(() => {
    (async () => {
      setMsg(null);
      setLoading(true);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id || null;
      if (!uid) return;

      const r1 = await supabase
        .from("business_profiles")
        .select(
          `
          business_id,
          businesses:businesses!business_profiles_business_id_fkey (
            id,
            name,
            brand_name,
            slug,
            public_embed_key,
            default_locale,
            billing_plan,
            billing_status,
            trial_end,
            widget_theme
          )
        `
        )
        .eq("id", uid)
        .maybeSingle<JoinRow>();

      let data: JoinRow | null = r1.data ?? null;
      let error: PostgrestErrLike = r1.error;

      

      if (/widget_theme.*does not exist/i.test(errMsg(error))) {
        const r2 = await supabase
          .from("business_profiles")
          .select(
            `
            business_id,
            businesses:businesses!business_profiles_business_id_fkey (
              id,
              slug,
              name,
              brand_name,
              public_embed_key,
              default_locale,
              billing_plan,
              billing_status,
              trial_end
            )
          `
          )
          .eq("id", uid)
          .maybeSingle<JoinRow>();

        data = r2.data ?? null;
        error = r2.error;
      }

      if (error) {
        console.error("[widget] profile join error:", errMsg(error));
        setMsg(t("messages.loadBusinessError"));
        return;
      }

      if (!data?.business_id || !data.businesses) {
        setBiz(null);
        return;
      }

      const b = data.businesses;

      const accessToken = sess.session?.access_token;
      if (accessToken && b.public_embed_key) {
        const r = await fetch(
          `/api/embed/preview-session?key=${encodeURIComponent(b.public_embed_key)}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const j = await r.json().catch(() => ({}));
        if (r.ok && j.token) {
          setPreviewSessionToken(String(j.token));
          setPreviewLocale(
            (String(j.locale || "en").toLowerCase().startsWith("es") ? "es" : "en") as
              | "en"
              | "es"
          );
          setPreviewShowBranding(Boolean(j.show_branding));
          setPreviewShowHeaderIcon(Boolean(j.show_header_icon));
        }
      }

      if (accessToken) {
        const statusRes = await fetch("/api/widget/install-status", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const statusJson = (await statusRes.json().catch(() => ({}))) as {
          ok?: boolean;
          installed?: boolean;
          activeDomainHost?: string | null;
          lastSeenAt?: string | null;
          widgetLive?: boolean;
        };
        if (statusRes.ok && statusJson.ok) {
          setInstallStatus({
            installed: Boolean(statusJson.installed),
            activeDomainHost: statusJson.activeDomainHost ?? null,
            lastSeenAt: statusJson.lastSeenAt ?? null,
          });
          if (typeof statusJson.widgetLive === "boolean") {
            setTheme((prev) => ({ ...prev, widgetLive: statusJson.widgetLive as boolean }));
            setInitialTheme((prev) => ({ ...prev, widgetLive: statusJson.widgetLive as boolean }));
          }
        }
      }

      if (accessToken) {
        const logoRes = await fetch("/api/widget/logo", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const logoJson = (await logoRes.json().catch(() => ({}))) as {
          ok?: boolean;
          hasLogo?: boolean;
          logoUrl?: string | null;
        };
        const nextLogoUrl = logoRes.ok && logoJson.ok && logoJson.hasLogo && logoJson.logoUrl
          ? logoJson.logoUrl
          : "";
        setLogoUrl(nextLogoUrl);
      }


      const effectiveBrand = (b.brand_name || b.name || "Aliigo").trim();
      const rawPlan = normalizePlan(b.billing_plan ?? "basic");
      const trialActive = isTrialActive(b.billing_status ?? null, b.trial_end ?? null);
      const plan = effectivePlanForEntitlements({
        billingPlan: b.billing_plan ?? "basic",
        billingStatus: b.billing_status ?? null,
        trialEnd: b.trial_end ?? null,
      });
      setBillingPlan(plan);
      setIsProTrial(
        trialActive &&
          (rawPlan === "basic" || rawPlan === "starter" || rawPlan === "growth")
      );
      setBrand(effectiveBrand);
      setInitialBrand(effectiveBrand);

      const dbTheme = toThemeDb(b.widget_theme);
      const merged = mergeTheme(dbTheme);
      if (plan === "basic" || plan === "starter") {
        merged.showBranding = true;
      }
      if (typeof merged.widgetLive !== "boolean") {
        merged.widgetLive = true;
      }

      setBiz({
        id: b.id,
        slug: b.slug,
        public_embed_key: b.public_embed_key ?? "",
        default_locale: b.default_locale === "es" ? "es" : "en",
        billing_plan: plan,
        widget_theme: dbTheme ?? {},
      });

      setTheme(merged);
      setInitialTheme(merged);
      setPreviewShowBranding(Boolean(merged.showBranding));
    })()
      .catch((e) => {
        console.error("[widget] load error:", e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setTheme((prev) => ({ ...prev, headerLogoUrl: logoUrl }));
  }, [logoUrl]);

  const dirty = useMemo(() => {
    const themeDirty = JSON.stringify(theme) !== JSON.stringify(initialTheme);
    const brandDirty = brand.trim() !== initialBrand.trim();
    return themeDirty || brandDirty;
  }, [theme, initialTheme, brand, initialBrand]);

  // ✅ split values for the new UI (no DB change)
  const headerSplit = useMemo(
    () => splitTwoHex(theme.headerBg),
    [theme.headerBg]
  );
  const userSplit = useMemo(
    () => splitTwoHex(theme.bubbleUser),
    [theme.bubbleUser]
  );
  const botSplit = useMemo(
    () => splitTwoHex(theme.bubbleBot),
    [theme.bubbleBot]
  );
  const sendSplit = useMemo(() => splitTwoHex(theme.sendBg), [theme.sendBg]);

  const previewThemeJson = useMemo(() => {
  return JSON.stringify({
    headerBg: theme.headerBg,
    bubbleUser: theme.bubbleUser,
    bubbleBot: theme.bubbleBot,
    sendBg: theme.sendBg,
    panelBg: theme.panelBg,
    panelOpacity: theme.panelOpacity,
    headerLogoUrl: theme.headerLogoUrl,
    showBranding: theme.showBranding,
    widgetLive: theme.widgetLive,
  });
}, [theme]);


  const saveTheme = async () => {
    setMsg(null);
    setSaving(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) {
        setMsg(t("messages.loginRequired"));
        return;
      }

      const res = await fetch("/api/widget/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          widget_theme: {
            headerBg: theme.headerBg,
            headerText: theme.headerText,
            bubbleUser: theme.bubbleUser,
            bubbleBot: theme.bubbleBot,
            sendBg: theme.sendBg,
            sendText: theme.sendText,
            panelBg: theme.panelBg,
            panelOpacity: theme.panelOpacity,
            showBranding: theme.showBranding,
            widgetLive: theme.widgetLive,
          },
          brand_name: brand,
        }),
      });

      const j: {
        ok?: boolean;
        error?: string;
        theme?: ThemeDb;
        brand_name?: string | null;
      } = await res.json().catch(() => ({}));

      if (!res.ok || !j.ok) {
        setMsg(j.error || t("messages.saveError"));
        return;
      }

      if (typeof j.brand_name === "string" && j.brand_name.trim()) {
        const bn = j.brand_name.trim();
        setBrand(bn);
        setInitialBrand(bn);
      } else {
        // If API didn’t echo, still lock in what we saved
        setInitialBrand(brand.trim());
      }

      const merged = mergeTheme(j.theme ?? theme);
      setTheme(merged);
      setInitialTheme(merged);
      setMsg(t("messages.saved"));
      // Force a full refresh so preview/session state is always in sync after save.
      setTimeout(() => {
        window.location.reload();
      }, 250);
    } catch (e: unknown) {
      console.error(e);
      setMsg(t("messages.saveNowError"));
    } finally {
      setSaving(false);
    }
  };

  const uploadHeaderLogo = async (file: File | null) => {
    if (!file) return;
    setLogoBusy(true);
    setLogoMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) {
        setLogoMsg(t("messages.loginRequired"));
        return;
      }

      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/widget/logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        logoUrl?: string | null;
        error?: string;
      };
      if (!res.ok || !j.ok) {
        setLogoMsg(j.error || t("messages.saveError"));
        return;
      }
      const next = j.logoUrl || "";
      setLogoUrl(next);
      setTheme((prev) => ({ ...prev, headerLogoUrl: next }));
      setLogoMsg(t("messages.saved"));
    } finally {
      setLogoBusy(false);
    }
  };

  const removeHeaderLogo = async () => {
    setLogoBusy(true);
    setLogoMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) {
        setLogoMsg(t("messages.loginRequired"));
        return;
      }
      const res = await fetch("/api/widget/logo", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setLogoMsg(j.error || t("messages.saveError"));
        return;
      }
      setLogoUrl("");
      setTheme((prev) => ({ ...prev, headerLogoUrl: "" }));
      setLogoMsg(t("messages.saved"));
    } finally {
      setLogoBusy(false);
    }
  };

  const embedCode = useMemo(() => {
    const key = biz?.public_embed_key || "PUBLIC_KEY";

    // IMPORTANT: client sites always load from aliigo.com
    const script = `<script src="https://aliigo.com/widget/v1/aliigo-widget.js" defer></script>`;

    const floating = `<aliigo-widget embed-key="${key}" api-base="https://aliigo.com" variant="floating"></aliigo-widget>`;
    return [
      script,
      "",
      "<!-- Floating (bottom-right pill) -->",
      floating,
    ].join("\n");
  }, [biz?.public_embed_key]);

  if (loading) {
    return <LoadingState label={t("status.loading")} className="p-4" />;
  }

  if (!biz) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">{t("noLinkedBusiness.title")}</h1>
        <p className="text-sm text-zinc-400">
          {t("noLinkedBusiness.body")}
        </p>
        {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
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
            msg === t("messages.saved") ? "text-green-400" : "text-zinc-300"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Preview + Theme */}
        <section className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40 space-y-4">
          <h2 className="font-semibold">{t("livePreview")}</h2>

          <Script src="/widget/v1/aliigo-widget.js" strategy="afterInteractive" />

          <div className="relative h-[420px] border border-zinc-800 rounded bg-zinc-950 p-6 overflow-visible">
            {previewSessionToken ? (
              <div className="absolute inset-0">
                <aliigo-widget
                  style={{ display: "block", width: "100%", height: "100%" }}
                  variant="floating"
                  floating-mode="absolute"
                  start-open="true"
                  api-base={getBaseUrl()}
                  locale={previewLocale}
                  session-token={previewSessionToken}
                  show-branding={previewShowBranding ? "true" : "false"}
                  show-header-icon={previewShowHeaderIcon ? "true" : "false"}
                  theme={previewThemeJson}
                  brand={brand}
                />
              </div>
            ) : (
              <div className="p-4 text-sm text-zinc-400">{t("loadingPreview")}</div>
            )}
          </div>


          {/* HEX inputs (bg + text) */}
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-300 font-medium">{t("header")}</div>
              <div className="text-xs text-zinc-500 sm:text-right">
                {t("bgText")}
              </div>

              <HexInput
                value={headerSplit.bg}
                fallback="#111827"
                onChange={(bg) =>
                  setTheme((t) => ({
                    ...t,
                    headerBg: joinTwoHex(bg, headerSplit.text || "#ffffff"),
                  }))
                }
              />
              <HexInput
                value={headerSplit.text}
                fallback="#ffffff"
                onChange={(text) =>
                  setTheme((t) => ({
                    ...t,
                    headerBg: joinTwoHex(headerSplit.bg || "#111827", text),
                  }))
                }
              />
            </div>

            {/* User bubble */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-300 font-medium">
                {t("userBubble")}
              </div>
              <div className="text-xs text-zinc-500 sm:text-right">
                {t("bgText")}
              </div>

              <HexInput
                value={userSplit.bg}
                fallback="#2563eb"
                onChange={(bg) =>
                  setTheme((t) => ({
                    ...t,
                    bubbleUser: joinTwoHex(bg, userSplit.text || "#ffffff"),
                  }))
                }
              />
              <HexInput
                value={userSplit.text}
                fallback="#ffffff"
                onChange={(text) =>
                  setTheme((t) => ({
                    ...t,
                    bubbleUser: joinTwoHex(userSplit.bg || "#2563eb", text),
                  }))
                }
              />
            </div>

            {/* Bot bubble */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-300 font-medium">
                {t("botBubble")}
              </div>
              <div className="text-xs text-zinc-500 sm:text-right">
                {t("bgText")}
              </div>

              <HexInput
                value={botSplit.bg}
                fallback="#f3f4f6"
                onChange={(bg) =>
                  setTheme((t) => ({
                    ...t,
                    bubbleBot: joinTwoHex(bg, botSplit.text || "#111827"),
                  }))
                }
              />
              <HexInput
                value={botSplit.text}
                fallback="#111827"
                onChange={(text) =>
                  setTheme((t) => ({
                    ...t,
                    bubbleBot: joinTwoHex(botSplit.bg || "#f3f4f6", text),
                  }))
                }
              />
            </div>
            
            {/* Panel background */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-300 font-medium">{t("panelBackground")}</div>
                <div className="text-xs text-zinc-500">{t("colorOpacity")}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <HexInput
                  value={theme.panelBg}
                  fallback="#09090b"
                  onChange={(bg) => setTheme((t) => ({ ...t, panelBg: bg }))}
                />

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((theme.panelOpacity ?? 1) * 100)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTheme((t) => ({ ...t, panelOpacity: Math.max(0, Math.min(1, v / 100)) }));
                    }}
                    className="w-full"
                  />
                  <div className="text-xs text-zinc-400 w-[44px] text-right">
                    {Math.round((theme.panelOpacity ?? 1) * 100)}%
                  </div>
                </div>
              </div>
            </div>


            {/* Send button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-300 font-medium">
                {t("sendButton")}
              </div>
              <div className="text-xs text-zinc-500 sm:text-right">
                {t("bgText")}
              </div>

              <HexInput
                value={sendSplit.bg}
                fallback="#2563eb"
                onChange={(bg) =>
                  setTheme((t) => ({
                    ...t,
                    sendBg: joinTwoHex(bg, sendSplit.text || "#ffffff"),
                  }))
                }
              />
              <HexInput
                value={sendSplit.text}
                fallback="#ffffff"
                onChange={(text) =>
                  setTheme((t) => ({
                    ...t,
                    sendBg: joinTwoHex(sendSplit.bg || "#2563eb", text),
                  }))
                }
              />
            </div>
          </div>
        </section>

        {/* RIGHT: Keys + actions */}
        <section className="space-y-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">{t("brand")}</label>
            <input
              className="w-full border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <label className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-zinc-200 inline-flex items-center gap-2">
                  {t("showPoweredBy")}
                  <EntitlementPill label={t("badges.growthPlus")} href="/dashboard/billing" />
                </div>
                <p className="text-xs text-zinc-500 mt-1">{t("showPoweredByHelp")}</p>
                {!canToggleBranding ? (
                  <p className="text-xs text-zinc-500 mt-1">{t("showPoweredByLockedHelp")}</p>
                ) : null}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={theme.showBranding}
                disabled={!canToggleBranding}
                onClick={() =>
                  setTheme((prev) => {
                    const next = !prev.showBranding;
                    setPreviewShowBranding(next);
                    return { ...prev, showBranding: next };
                  })
                }
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  theme.showBranding ? "bg-brand-500/80" : "bg-zinc-700"
                } ${!canToggleBranding ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme.showBranding ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-3">
            <label className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-zinc-200">{t("liveControl")}</div>
                <p className="text-xs text-zinc-500 mt-1">{t("liveControlHelp")}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={theme.widgetLive}
                onClick={() => setTheme((prev) => ({ ...prev, widgetLive: !prev.widgetLive }))}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  theme.widgetLive ? "bg-brand-500/80" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme.widgetLive ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            <div className="flex items-start justify-between gap-3 rounded-md border border-zinc-800/80 bg-zinc-950/50 px-3 py-2">
              <div>
                <div className="text-xs font-medium text-zinc-200">{t("installedSignal")}</div>
                {installStatus?.lastSeenAt ? (
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {t("lastSeen")} {new Date(installStatus.lastSeenAt).toLocaleString()}
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-zinc-500">{t("notDetectedYet")}</div>
                )}
                {installStatus?.activeDomainHost ? (
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {t("domainLabel")}{" "}
                    <span className="font-medium text-zinc-300">{installStatus.activeDomainHost}</span>
                  </div>
                ) : null}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  installStatus?.installed
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700"
                }`}
              >
                <span
                  className={`mr-1.5 inline-flex h-2 w-2 rounded-full ${
                    installStatus?.installed ? "bg-emerald-300 animate-pulse" : "bg-zinc-500"
                  }`}
                />
                {installStatus?.installed ? t("installedOnDomain") : t("notInstalled")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-300">
              <span className="inline-flex items-center gap-2">
                {t("headerLogoUrl")}
                <EntitlementPill label={t("badges.growthPlus")} href="/dashboard/billing" />
              </span>
            </label>
            {!canManageHeaderLogo ? (
              <p className="text-xs text-zinc-500">{t("headerLogoLockedHelp")}</p>
            ) : null}
            {logoUrl ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                <img src={logoUrl} alt="" className="h-8 w-8 rounded object-contain border border-zinc-700" />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className={btnNeutral}
                    disabled={logoBusy || !canManageHeaderLogo}
                    onClick={() => {
                      const input = document.getElementById("widget-logo-input") as HTMLInputElement | null;
                      input?.click();
                    }}
                  >
                    {t("buttons.replaceLogo")}
                  </button>
                  <button
                    type="button"
                    className={btnNeutralStrong}
                    disabled={logoBusy || !canManageHeaderLogo}
                    onClick={removeHeaderLogo}
                  >
                    {t("buttons.removeLogo")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={btnNeutral}
                disabled={logoBusy || !canManageHeaderLogo}
                onClick={() => {
                  const input = document.getElementById("widget-logo-input") as HTMLInputElement | null;
                  input?.click();
                }}
              >
                {t("buttons.uploadLogo")}
              </button>
            )}
            <input
              id="widget-logo-input"
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={!canManageHeaderLogo}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void uploadHeaderLogo(file);
                e.currentTarget.value = "";
              }}
            />
            <p className="text-xs text-zinc-500">{t("headerLogoHelp")}</p>
            {logoMsg ? <p className="text-xs text-zinc-400">{logoMsg}</p> : null}
          </div>

          {widgetLocked ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-zinc-100">{t("embedSnippet")}</div>
              <div className="text-xs text-amber-400">{t("lockedHint")}</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-zinc-100">{t("embedSnippet")}</div>
              <textarea
                className="w-full border border-zinc-800 bg-zinc-950 text-zinc-200 rounded px-3 py-2 text-xs"
                rows={10}
                value={embedCode}
                readOnly
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              className={btnBrand}
              onClick={saveTheme}
              disabled={!dirty || saving}
            >
              {saving ? t("buttons.saving") : t("buttons.saveTheme")}
            </button>

            <button
              className={btnNeutral}
              onClick={() => {
                setTheme(initialTheme);
                setBrand(initialBrand);
                setMsg(null);
              }}
              disabled={!dirty || saving}
            >
              {t("buttons.reset")}
            </button>

            <Link href="/dashboard/widget/advanced" className={btnNeutralStrong}>
              {t("buttons.advancedSettings")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
