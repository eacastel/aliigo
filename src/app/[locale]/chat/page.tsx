// src/app/[locale]/chat/page.tsx

"use client";

import { useEffect, Suspense } from "react";
import ClientEmbed from "./ClientEmbed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  robots: { index: false, follow: false },
};

function TransparencyEnforcer() {
  useEffect(() => {
    // 1. STRIP PARENT CLASSES
    // This removes 'bg-background' and dark mode classes from the root <body>
    document.body.className = "";
    document.documentElement.className = "";

    // 2. FORCE TRANSPARENCY
    const style = document.documentElement.style;
    const bodyStyle = document.body.style;
    
    style.backgroundColor = "transparent";
    style.background = "transparent";
    
    bodyStyle.backgroundColor = "transparent";
    bodyStyle.background = "transparent";
    
    // 3. HIDE PARENT UI (If your main layout has a Navbar/Footer)
    // Since we deleted chat/layout.tsx, we might inherit the nav. Hide it.
    const header = document.querySelector('header') || document.querySelector('nav');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';

  }, []);

  return null;
}

export default function EmbeddedChatPage() {
  return (
    <>
      <TransparencyEnforcer />
      <style>{`
        /* Extra safety net */
        html, body, #__next { 
            background: transparent !important; 
            background-color: transparent !important; 
        }
      `}</style>
      <Suspense fallback={<div style={{ background: "transparent" }} />}>
        <ClientEmbed />
      </Suspense>
    </>
  );
}