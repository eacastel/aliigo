"use client";

import { useSearchParams } from "next/navigation";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

/**
 * Iframe endpoint for embedding the widget on external sites.
 * Reads ?slug=&brand=&token=&theme= from the URL and renders the widget.
 */
export default function EmbeddedChatPage() {
  const params = useSearchParams();

  const slug = params.get("slug") ?? "default";
  const brand = params.get("brand") ?? "Aliigo";
  const token = params.get("token") ?? undefined;

  let theme: any = undefined;
  const themeParam = params.get("theme");
  if (themeParam) {
    try {
      theme = JSON.parse(themeParam);
    } catch {
      /* ignore bad theme param */
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
