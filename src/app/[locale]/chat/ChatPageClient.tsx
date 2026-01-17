// src/app/[locale]/chat/ChatPageClient.tsx
"use client";

import { useEffect, Suspense } from "react";
import ClientEmbed from "./ClientEmbed";

function TransparencyEnforcer() {
  useEffect(() => {
    // 1. STRIP PARENT CLASSES
    document.body.className = "";
    document.documentElement.className = "";

    // 2. FORCE TRANSPARENCY
    const style = document.documentElement.style;
    const bodyStyle = document.body.style;
    
    style.backgroundColor = "transparent";
    style.background = "transparent";
    
    bodyStyle.backgroundColor = "transparent";
    bodyStyle.background = "transparent";
    
    // 3. HIDE PARENT UI
    const header = document.querySelector('header') || document.querySelector('nav');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';

  }, []);

  return null;
}

export default function ChatPageClient() {
  return (
    <>
      <TransparencyEnforcer />
      <style dangerouslySetInnerHTML={{ __html: `
        /* Extra safety net */
        html, body, #__next { 
            background: transparent !important; 
            background-color: transparent !important; 
        }
      `}} />
      <Suspense fallback={<div style={{ background: "transparent" }} />}>
        <ClientEmbed />
      </Suspense>
    </>
  );
}