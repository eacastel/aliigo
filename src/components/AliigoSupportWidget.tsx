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
    <AliigoChatWidget
      businessSlug="aliigo"
      brand="Aliigo"
      token={token}
      parentHost={parentHost}
      locale={locale}
      channel="web"
      theme={{
        headerBg: "bg-emerald-600",
        headerText: "text-white",
        bubbleUser: "bg-emerald-600 text-white",
        bubbleBot: "bg-emerald-50 text-emerald-950",
        sendBg: "bg-emerald-600",
        sendText: "text-white",
      }}
    />
  );
}
