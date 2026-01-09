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

type SessionResp = { token: string | null; error?: string };

export default function ClientEmbed() {
  const params = useSearchParams();

  const slug = params.get("slug") ?? "default";
  const brand = params.get("brand") ?? "Aliigo";
  const key = params.get("key") ?? "";

  const [token, setToken] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  function getReferrerHost(): string | null {
    const ref = document.referrer;
    if (!ref) return null;
    try { return new URL(ref).host.replace(/:\d+$/, ""); } catch { return null; }
  }

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

    const hostFromQuery = (params.get("host") || "").trim().toLowerCase();
    const refHost = (getReferrerHost() || "").toLowerCase();
    const host = hostFromQuery || refHost;

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

      // If API returns HTML (like a redirect or error page), res.json() will fail.
      const ct = res.headers.get("content-type") || "";
      let data: SessionResp | null = null;

      if (ct.includes("application/json")) {
        try {
          data = (await res.json()) as SessionResp;
        } catch {
          data = null;
        }
      } else {
        // capture a small snippet so you can see what's coming back
        const text = await res.text().catch(() => "");
        if (!cancelled) {
          setErr(`Unexpected response (${res.status}) from /api/embed/session: ${text.slice(0, 120)}`);
          setLoading(false);
        }
        return;
      }

      if (cancelled) return;

      // Domain block: show a visible message (no more silent blank)
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
  }, [key, params]);

  // Always show something so debugging isn't “black box”
  if (blocked) {
    return (
      <div className="w-full h-dvh flex items-center justify-center bg-transparent">
        <div className="text-xs px-3 py-2 rounded-xl border border-white/20 bg-black/40 text-white">
          Embed blocked: domain not allowlisted for this key.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      {loading && (
        <div className="w-full h-dvh flex items-center justify-center">
          <div className="text-xs px-3 py-2 rounded-xl border border-white/20 bg-black/40 text-white">
            Loading Aliigo widget…
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
        <AliigoChatWidget businessSlug={slug} brand={brand} token={token} theme={theme} />
      ) : null}
    </div>
  );
}
