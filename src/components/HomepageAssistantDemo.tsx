// src/components/HomepageAssistantDemo.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

function pathLocale(pathname: string): "en" | "es" {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "es" ? "es" : "en";
}

// IMPORTANT: AliigoChatWidget expects hex pairs like "#111827 #ffffff".
// Do NOT pass Tailwind classes here.
const DEMO_THEME = {
  headerBg: "#111827 #ffffff",
  headerText: "#ffffff",
  bubbleUser: "#84c9ad #0b0f0e", // your mint + dark text
  bubbleBot: "#0b1220 #e5e7eb",  // dark bubble + light text
  sendBg: "#84c9ad #0b0f0e",
  sendText: "#0b0f0e",
};

export function HomepageAssistantDemo({
  brand = "Aliigo",
  businessSlug = "aliigo",
}: {
  brand?: string;
  businessSlug?: string;
}) {
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

  // If you want it visible even without token, you can remove this guard and pass preview={true} only.
  if (!token) return null;

  const parentHost =
    typeof window !== "undefined"
      ? window.location.host.replace(/:\d+$/, "").toLowerCase()
      : "";

  return (
    <div className="relative h-[380px] border-0 bg-zinc-950/60 overflow-hidden">
      <AliigoChatWidget
        preview
        alwaysOpen
        businessSlug={businessSlug}
        brand={brand}
        token={token}
        parentHost={parentHost}
        locale={locale}
        channel="web"
        theme={DEMO_THEME}
        variant="inline"
        skin="dark"
        height={380} 
      />
    </div>
  );
}
