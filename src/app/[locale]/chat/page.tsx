// src/app/[locale]/chat/page.tsx
import { Suspense } from "react";
import ClientEmbed from "./ClientEmbed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  robots: { index: false, follow: false },
};

export default function EmbeddedChatPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Force everything to be transparent */
        :root, html, body, #__next, main {
          background-color: transparent !important;
          background: transparent !important;
        }
        /* Specifically target the Tailwind class causing the black box */
        .bg-background {
          background-color: transparent !important;
        }
      `}} />

      <Suspense fallback={<div style={{ background: "transparent" }} />}>
        <ClientEmbed />
      </Suspense>
    </>
  );
}