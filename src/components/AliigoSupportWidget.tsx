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
        headerBg: "bg-gray-900",
        headerText: "text-white",
        bubbleUser: "bg-blue-600 text-white",
        bubbleBot: "bg-gray-100 text-gray-900",
        sendBg: "bg-blue-600",
        sendText: "text-white",
      }}
    />
  );
}
