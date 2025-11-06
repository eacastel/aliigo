"use client";

import { useSearchParams } from "next/navigation";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

type Theme = {
  headerBg?: string;
  headerText?: string;
  bubbleUser?: string;
  bubbleBot?: string;
  sendBg?: string;
  sendText?: string;
};

export default function ClientEmbed() {
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
      // ignore malformed theme
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
