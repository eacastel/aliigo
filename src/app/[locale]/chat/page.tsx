// /src/app/[locale]/chat/page.tsx

import { Suspense } from "react";
import ClientEmbed from "./ClientEmbed";

// Render at request-time; good for query params
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Per-route robots (ok here because this file is server-side)
export const metadata = {
  robots: { index: false, follow: false },
};

export default function EmbeddedChatPage() {
  return (
    <>
      <style>{`
        /* Force transparency on everything up to the widget */
        :root, html, body, #__next {
          background-color: transparent !important;
          background: transparent !important;
        }
      `}</style>

      <Suspense fallback={<div />}>
        <ClientEmbed />
      </Suspense>
    </>
  );
}