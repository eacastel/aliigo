"use client";

import { useEffect, useState } from "react";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

export function AliigoSupportWidget() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/support-token");
        const j = await res.json();
        if (res.ok) setToken(j.token || null);
      } catch {
        // noop
      }
    })();
  }, []);

  if (!token) return null;

  return (
    <AliigoChatWidget
      businessSlug="aliigo"
      brand="Aliigo Soporte"
      token={token}
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
