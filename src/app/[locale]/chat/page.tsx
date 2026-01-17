// src/app/[locale]/chat/page.tsx
import { Metadata } from "next";
import ChatPageClient from "./ChatPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// This is now allowed because there is no "use client" directive in this file
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbeddedChatPage() {
  return <ChatPageClient />;
}