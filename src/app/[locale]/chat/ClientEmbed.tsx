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
  const key = params.get("key") ?? ""; // public embed key

  const [token, setToken] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const theme: Theme | undefined = useMemo(() => {
    const themeParam = params.get("theme");
    if (!themeParam) return undefined;

    // theme is URL-encoded JSON in your snippet, so decode first
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

      if (!key) {
        setErr("Missing key");
        return;
      }

      const url = `/api/embed/session?key=${encodeURIComponent(key)}`;

      let res: Response;
      try {
        res = await fetch(url, { method: "GET", cache: "no-store" });
      } catch {
        if (!cancelled) setErr("Network error");
        return;
      }

      let data: SessionResp | null = null;
      try {
        data = (await res.json()) as SessionResp;
      } catch {
        data = null;
      }

      if (cancelled) return;

      // If domain is not allowlisted, we treat it as "not embeddable": render nothing.
      if (res.status === 403 && (data?.error || "").toLowerCase().includes("domain")) {
        setBlocked(true);
        return;
      }

      if (!res.ok) {
        setErr(data?.error || "Failed to create embed session");
        return;
      }

      const t = data?.token ?? null;
      if (!t) {
        setErr("No token available");
        return;
      }

      setToken(t);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [key]);

  // ✅ If blocked, show nothing (no button, no panel)
  if (blocked) return null;

  return (
    <div className="w-full h-dvh bg-transparent">
      {/* ✅ Only render the widget once we have a token */}
      {token ? (
        <AliigoChatWidget
          businessSlug={slug}
          brand={brand}
          token={token}
          theme={theme}
        />
      ) : null}

      {/* Optional: show errors ONLY for real failures (not domain blocks) */}
      {err && (
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-xs text-gray-700">
          {err}
        </div>
      )}
    </div>
  );
}
