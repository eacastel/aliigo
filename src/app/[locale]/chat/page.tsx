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
        /* 1. Nuke all backgrounds on the root elements */
        html, body {
          background-color: transparent !important;
          background-image: none !important;
          background: transparent !important;
        }
        
        /* 2. Override Tailwind 'bg-background' specifically if it exists */
        body.bg-background {
          background-color: transparent !important;
        }

        /* 3. Ensure the Next.js root div is also transparent */
        #__next, main {
          background: transparent !important;
        }
      `}} />

      <Suspense fallback={<div style={{ background: "transparent" }} />}>
        <ClientEmbed />
      </Suspense>
    </>
  );
}