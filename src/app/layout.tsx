// src/app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import SiteHeaderPublic from "@/components/SiteHeaderPublic";
import SiteFooter from "@/components/SiteFooter";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 text-zinc-100 flex min-h-dvh flex-col">
        <SiteHeaderPublic />
        <main className="grow">{children}</main> {/* ← This renders page.tsx or nested layouts/pages */}
        <SiteFooter />
      </body>
    </html>
  );
}
