// src/components/AliigoSupportWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

function pathLocale(pathname: string): "en" | "es" {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "es" ? "es" : "en";
}

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

  const parentHost =
    typeof window !== "undefined"
      ? window.location.host.replace(/:\d+$/, "").toLowerCase()
      : "";

  return (
    <div id="aliigo-widget">
    <AliigoChatWidget
      businessSlug="aliigo"
      brand="Aliigo"
      token={token}
      parentHost={parentHost}
      locale={locale}
      channel="web"
      skin="dark"
      theme={{
        headerBg: "#0b1220 #ffffff",
        bubbleUser: "#84c9ad #0a0a0a",
        bubbleBot: "#f3f4f6 #111827",
        sendBg: "#84c9ad #0a0a0a",
      }}
    />
    </div>
  );
}
