// src/app/[locale]/chat/ClientEmbed.tsx
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

export default function ClientEmbed() {
  const params = useSearchParams();

  const slug = params.get("slug") ?? "default";
  const brand = params.get("brand") ?? "Aliigo";
  const key = params.get("key") ?? ""; // public key

  const [token, setToken] = useState<string | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  const theme: Theme | undefined = useMemo(() => {
    const themeParam = params.get("theme");
    if (!themeParam) return undefined;
    try {
      return JSON.parse(themeParam) as Theme;
    } catch {
      return undefined;
    }
  }, [params]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr(null);
      setToken(undefined);

      if (!key) {
        setErr("Missing key");
        return;
      }

      // IMPORTANT: use the route path you will actually create:
      // src/app/api/embed/session/route.ts  ->  /api/embed/session
      const url = `/api/embed/session?key=${encodeURIComponent(
        key
      )}&slug=${encodeURIComponent(slug)}`;

      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
      } catch {
        if (!cancelled) setErr("Network error");
        return;
      }

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        // non-json response
      }

      if (cancelled) return;

      const obj = (data && typeof data === "object") ? (data as Record<string, unknown>) : {};

      if (!res.ok) {
        setErr((obj.error as string) || "Failed to create embed session");
        return;
      }

      const t = obj.token;
      if (typeof t !== "string" || !t) {
        setErr("No token available for this business");
        return;
      }

      setToken(t);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [key, slug]);

  return (
    <div className="w-full h-dvh bg-transparent">
      <AliigoChatWidget businessSlug={slug} brand={brand} token={token} theme={theme} />

      {err && (
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2 text-xs text-gray-700">
          {err}
        </div>
      )}
    </div>
  );
}
