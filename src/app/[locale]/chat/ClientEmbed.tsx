// /src/app/[locale]/chat/ClientEmbed.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

type Theme = {
  headerBg?: string;
  headerText?: string;
  bubbleUser?: string;
  bubbleBot?: string;
  sendBg?: string;
  sendText?: string;
};


type Locale = "en" | "es" | "fr" | "it" | "de";
type SessionResp = { token: string | null; locale?: string; error?: string };

const SUPPORTED_LOCALES = new Set<Locale>(["en", "es", "fr", "it", "de"]);
function normalizeLocale(v: unknown): Locale {
  if (typeof v !== "string") return "en";
  const s = v.toLowerCase().trim() as Locale;
  return SUPPORTED_LOCALES.has(s) ? s : "en";
}

function getReferrerHost(): string | null {
  const ref = document.referrer;
  if (!ref) return null;
  try {
    return new URL(ref).host.replace(/:\d+$/, "");
  } catch {
    return null;
  }
}

function loadingText(locale: Locale, brand: string) {
  const b = (brand || "Aliigo").trim();

  switch (locale) {
    case "es":
      return `Cargando ${b}…`;
    case "fr":
      return `Chargement de ${b}…`;
    case "it":
      return `Caricamento di ${b}…`;
    case "de":
      return `Lade ${b}…`;
    default:
      return `Loading ${b}…`;
  }
}

function blockedText(locale: Locale) {
  switch (locale) {
    case "es":
      return "Embed bloqueado: este dominio no está permitido para esta clave.";
    case "fr":
      return "Intégration bloquée : ce domaine n’est pas autorisé pour cette clé.";
    case "it":
      return "Embed bloccato: questo dominio non è consentito per questa chiave.";
    case "de":
      return "Embed blockiert: Diese Domain ist für diesen Schlüssel nicht erlaubt.";
    default:
      return "Embed blocked: domain not allowlisted for this key.";
  }
}

export default function ClientEmbed() {
  const params = useSearchParams();

  const localeParam = (params.get("locale") || params.get("lang") || "").trim().toLowerCase();


  const slug = params.get("slug") ?? "default";
  const brand = params.get("brand") ?? "Aliigo";
  const key = params.get("key") ?? "";

  // read once per render (safe for deps)
  const hostFromQuery = (params.get("host") || "").trim().toLowerCase();

  const [token, setToken] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [locale, setLocale] = useState<Locale>("en");
  const [parentHost, setParentHost] = useState<string>("");

  const theme: Theme | undefined = useMemo(() => {
    const themeParam = params.get("theme");
    if (!themeParam) return undefined;
    try {
      const decoded = decodeURIComponent(themeParam);
      const parsed: unknown = JSON.parse(decoded);
      if (!parsed || typeof parsed !== "object") return undefined;
      return parsed as Theme;
    } catch {
      return undefined;
    }
  }, [params]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr(null);
      setBlocked(false);
      setToken(null);
      setLoading(true);

      if (!key) {
        setErr("Missing key");
        setLoading(false);
        return;
      }

      // If locale is explicitly passed in the embed URL, it wins.
      if (localeParam) setLocale(normalizeLocale(localeParam));


      const refHost = (getReferrerHost() || "").toLowerCase();
      const host = hostFromQuery || refHost;

      setParentHost(host || "");

      const url =
        `/api/embed/session?key=${encodeURIComponent(key)}` +
        (host ? `&host=${encodeURIComponent(host)}` : "");

      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          credentials: "omit",
          headers: { Accept: "application/json" },
        });
      } catch {
        if (!cancelled) {
          setErr("Network error calling /api/embed/session");
          setLoading(false);
        }
        return;
      }

      const ct = res.headers.get("content-type") || "";
      let data: SessionResp | null = null;

      if (ct.includes("application/json")) {
        try {
          data = (await res.json()) as SessionResp;
        } catch {
          data = null;
        }
      } else {
        const text = await res.text().catch(() => "");
        if (!cancelled) {
          setErr(
            `Unexpected response (${res.status}) from /api/embed/session: ${text.slice(
              0,
              120
            )}`
          );
          setLoading(false);
        }
        return;
      }

      if (cancelled) return;

      // If URL doesn’t specify locale, fall back to server-provided locale.
      if (!localeParam) setLocale(normalizeLocale(data?.locale));

      if (res.status === 403 && (data?.error || "").toLowerCase().includes("domain")) {
        setBlocked(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErr(data?.error || `Failed to create embed session (${res.status})`);
        setLoading(false);
        return;
      }

      const t = data?.token ?? null;
      if (!t) {
        setErr("No token returned from /api/embed/session");
        setLoading(false);
        return;
      }

      setToken(t);
      setLoading(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [key, hostFromQuery, localeParam]);

  if (blocked) {
    return (
      <div className="w-full h-dvh flex items-center justify-center bg-transparent">
        <div className="text-xs px-3 py-2 rounded-xl border border-white/20 bg-black/40 text-white">
          {blockedText(locale)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      {loading && (
        <div className="w-full h-dvh flex items-center justify-center">
          <div className="text-xs px-3 py-2 rounded-xl border border-white/20 bg-black/40 text-white">
            {loadingText(locale, brand)}
          </div>
        </div>
      )}

      {!loading && err && (
        <div className="w-full h-dvh flex items-center justify-center">
          <div className="max-w-[90vw] text-xs px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200">
            {err}
          </div>
        </div>
      )}

      {!loading && token && !err ? (
        <AliigoChatWidget
          businessSlug={slug}
          brand={brand}
          token={token}
          theme={theme}
          locale={locale}
          parentHost={parentHost}
          channel="web"
        />
      ) : null}
    </div>
  );
}
