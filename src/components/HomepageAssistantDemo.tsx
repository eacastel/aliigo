"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AliigoWidgetElement } from "@/components/AliigoWidgetElement";
import type { WidgetTheme } from "@/types/widgetTheme";

function pathLocale(pathname: string): "en" | "es" {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "es" ? "es" : "en";
}

type SupportCfg = {
  token: string;
  brand: string;
  theme: WidgetTheme | null;
};

const DEFAULT_THEME: WidgetTheme = {
  headerBg: "#111827 #ffffff",
  bubbleUser: "#2563eb #ffffff",
  bubbleBot: "#f3f4f6 #111827",
  sendBg: "#2563eb #ffffff",
  panelBg: "#09090b",
  panelOpacity: 0.72,
};

function isWidgetTheme(x: unknown): x is WidgetTheme {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;

  const okStr = (v: unknown) => typeof v === "string";
  const okNum = (v: unknown) => typeof v === "number";

  return (
    (o.headerBg === undefined || okStr(o.headerBg)) &&
    (o.bubbleUser === undefined || okStr(o.bubbleUser)) &&
    (o.bubbleBot === undefined || okStr(o.bubbleBot)) &&
    (o.sendBg === undefined || okStr(o.sendBg)) &&
    (o.panelBg === undefined || okStr(o.panelBg)) &&
    (o.panelOpacity === undefined || okNum(o.panelOpacity))
  );
}

export function HomepageAssistantDemo() {
  const [cfg, setCfg] = useState<SupportCfg | null>(null);
  const pathname = usePathname();
  const locale = pathLocale(pathname);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/support-token", { cache: "no-store" });
        const j = (await res.json().catch(() => ({}))) as unknown;

        if (!res.ok) return;

        const o = (j && typeof j === "object") ? (j as Record<string, unknown>) : {};
        const token = typeof o.token === "string" ? o.token : "";
        if (!token) return;

        const brand = typeof o.brand === "string" && o.brand.trim() ? o.brand.trim() : "Aliigo";
        const theme = isWidgetTheme(o.theme) ? o.theme : null;

        if (!cancelled) setCfg({ token, brand, theme });
      } catch {
        // noop
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!cfg?.token) return null;

  return (
    <div
      id="homepage-assistant-demo"
      className="relative h-[495px] border-0 bg-zinc-950/60 overflow-hidden"
    >
      <AliigoWidgetElement
        variant="inline"
        locale={locale}
        brand={cfg.brand}
        sessionToken={cfg.token}
        theme={cfg.theme ?? DEFAULT_THEME}
        startOpen
        hideHeader
      />
    </div>
  );
}
