// src/app/embed/chat/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

// Don't prerender; always handle at request time (safer for query params)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Keep crawlers from indexing the iframe endpoint
export const metadata = {
  robots: { index: false, follow: false },
};

type Theme = {
  headerBg?: string;
  headerText?: string;
  bubbleUser?: string;
  bubbleBot?: string;
  sendBg?: string;
  sendText?: string;
};

function ChatInner() {
  const params = useSearchParams();

  const slug = params.get("slug") ?? "default";
  const brand = params.get("brand") ?? "Aliigo";
  const token = params.get("token") ?? undefined;

  let theme: Theme | undefined;
  const themeParam = params.get("theme");
  if (themeParam) {
    try {
      theme = JSON.parse(themeParam) as Theme;
    } catch {
      // ignore malformed theme param
    }
  }

  return (
    <div className="w-full h-dvh bg-transparent">
      <AliigoChatWidget
        businessSlug={slug}
        brand={brand}
        token={token}
        theme={theme}
      />
    </div>
  );
}

export default function EmbeddedChatPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
          }}
        />
      }
    >
      <ChatInner />
    </Suspense>
  );
}
