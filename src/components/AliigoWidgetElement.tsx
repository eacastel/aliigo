"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __aliigoWidgetV1Loaded?: boolean;
  }
}

type Theme = {
  headerBg?: string;   // "#111827 #ffffff"
  bubbleUser?: string; // "#2563eb #ffffff"
  bubbleBot?: string;  // "#f3f4f6 #111827"
  sendBg?: string;     // "#2563eb #ffffff"
};

export function AliigoWidgetElement({
  sessionToken,
  locale,
  brand,
  variant,
  floatingMode,
  theme,
  startOpen,
  hideHeader,
  apiBase,
  embedKey,
}: {
  sessionToken?: string | null;
  locale: "en" | "es";
  brand?: string;
  variant: "floating" | "inline" | "hero";
  floatingMode?: "fixed" | "absolute";
  theme?: Theme | null;
  startOpen?: boolean;
  hideHeader?: boolean;
  apiBase?: string; // optional override
  embedKey?: string; // optional for real installs
}) {
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__aliigoWidgetV1Loaded) return;

    const src = "/widget/v1/aliigo-widget.js";
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      window.__aliigoWidgetV1Loaded = true;
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      window.__aliigoWidgetV1Loaded = true;
    };
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    return () => {
      const el = elRef.current;
      if (el && el.parentElement) {
        el.parentElement.removeChild(el);
      }
    };
  }, []);

  // If token missing, don’t render the element (your current behavior).
  if (!sessionToken && !embedKey) return null;

  const themeAttr = theme ? JSON.stringify(theme) : undefined;

  return (
    <aliigo-widget
      ref={elRef}
      variant={variant}
      floating-mode={floatingMode}
      api-base={apiBase}
      embed-key={embedKey}
      session-token={sessionToken || undefined}
      locale={locale}
      brand={brand}
      theme={themeAttr}
      start-open={startOpen ? "true" : undefined}
      hide-header={hideHeader ? "true" : undefined}
    />
  );
}
