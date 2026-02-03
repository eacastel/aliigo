// src/components/AliigoSupportWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AliigoWidgetElement } from "@/components/AliigoWidgetElement";

function pathLocale(pathname: string): "en" | "es" {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "es" ? "es" : "en";
}

const SUPPORT_THEME = {
  headerBg: "#0b1220 #ffffff",
  bubbleUser: "#84c9ad #0a0a0a",
  bubbleBot: "#f3f4f6 #111827",
  sendBg: "#84c9ad #0a0a0a",
};

export function AliigoSupportWidget() {
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();
  const locale = pathLocale(pathname);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/support-token");
        const j = await res.json().catch(() => ({}));
        if (res.ok) setToken(j.token || null);
      } catch {
        // noop
      }
    })();
  }, []);

  if (!token) return null;

  return (
    <div id="aliigo-widget">
      <AliigoWidgetElement
        variant="floating"
        floatingMode="fixed"
        locale={locale}
        brand="Aliigo"
        sessionToken={token}
        theme={SUPPORT_THEME}
      />
    </div>
  );
}
