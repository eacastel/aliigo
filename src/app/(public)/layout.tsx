// src/app/(public)/layout.tsx
import type { ReactNode } from "react";
import SiteHeaderPublic from "@/components/SiteHeaderPublic";
import SiteFooter from "@/components/SiteFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeaderPublic />
      <main className="grow">{children}</main>
      <SiteFooter />
    </div>
  );
}
