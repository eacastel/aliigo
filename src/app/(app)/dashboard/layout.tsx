// src/app/(app)/dashboard/layout.tsx
import type { ReactNode } from "react";
import DashboardTopBar from "@/components/DashboardTopBar";
import SiteFooter from "@/components/SiteFooter";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
      <DashboardTopBar />
      <main className="max-w-5xl mx-auto px-4 py-6 w-full grow">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
