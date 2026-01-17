// src/app/[locale]/chat/page.tsx
"use client";

import { useLayoutEffect, Suspense } from "react";
import ClientEmbed from "./ClientEmbed";

// 1. Force dynamic rendering so it doesn't cache incorrectly
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function EmbeddedChatPage() {
  // 2. The "Nuclear" Transparency Fix
  useLayoutEffect(() => {
    // This runs before the browser paints to prevent "flashing" black
    const nukeBackground = () => {
      // Remove Tailwind/Theme classes from the parent <body>
      document.body.classList.remove("bg-background", "dark", "bg-zinc-950", "text-foreground");
      
      // Force inline styles to transparent
      document.documentElement.style.background = "transparent";
      document.documentElement.style.backgroundColor = "transparent";
      document.body.style.background = "transparent";
      document.body.style.backgroundColor = "transparent";
    };

    nukeBackground();

    // Watch for Next.js trying to re-add classes (hydration) and strip them again
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === "attributes" && (m.attributeName === "class" || m.attributeName === "style")) {
          nukeBackground();
        }
      });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });

    // Hide global nav/footer if they exist in the root layout
    const header = document.querySelector("header") || document.querySelector("nav");
    const footer = document.querySelector("footer");
    if (header) header.style.display = "none";
    if (footer) footer.style.display = "none";

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <title>Aliigo Widget</title>
      <meta name="robots" content="noindex, nofollow" />

      {/* 3. Brute Force CSS Override */}
      <style jsx global>{`
        html, body, #__next, main {
          background-color: transparent !important;
          background: transparent !important;
          min-height: 0 !important;
        }
        /* Override specific Tailwind classes if they persist */
        .bg-background, .bg-zinc-950 {
          background-color: transparent !important;
        }
      `}</style>

      <Suspense fallback={<div style={{ background: "transparent", width: "100%", height: "100%" }} />}>
        <ClientEmbed />
      </Suspense>
    </>
  );
}