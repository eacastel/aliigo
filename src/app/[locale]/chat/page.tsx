// src/app/[locale]/chat/page.tsx
import { Metadata } from "next";
import ChatPageClient from "./ChatPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbeddedChatPage() {
  return <ChatPageClient />;
}