// /src/app/[locale]/chat/page.tsx

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
      <style>{`
        /* 1. Force transparency on the root */
        :root, html, body {
          background-color: transparent !important;
          background: transparent !important;
          min-height: 0 !important; /* Prevent full height forcing */
        }
        /* 2. Fix Next.js default layout wrapper if present */
        #__next, main {
          background: transparent !important;
        }
      `}</style>

      <Suspense fallback={<div style={{ background: "transparent" }} />}>
        <ClientEmbed />
      </Suspense>
    </>
  );
}