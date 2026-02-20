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
  showHeaderIcon: boolean;
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

export function AliigoSupportWidget() {
  const [cfg, setCfg] = useState<SupportCfg | null>(null);
  const [apiBase, setApiBase] = useState<string>("");
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
        const showHeaderIcon = Boolean(o.show_header_icon);

        if (!cancelled) setCfg({ token, brand, theme, showHeaderIcon });
      } catch {
        // noop
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiBase(window.location.origin);
    }
  }, []);

  if (!cfg?.token || !apiBase) return null;

  return (
    <AliigoWidgetElement
      key={locale}
      dataOwner="support"
      noTeleport
      variant="floating"
      floatingMode="fixed"
      apiBase={apiBase}
      locale={locale}
      brand={cfg.brand}
      sessionToken={cfg.token}
      theme={cfg.theme ?? undefined}
      showHeaderIcon={cfg.showHeaderIcon}
    />
  );
}
