"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LogoutButton from "./LogoutButton";

export default function DashboardTopBar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold text-white tracking-tight">
            Aliigo
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-300">
            <Link href="/dashboard" className="hover:text-white">Inicio</Link>
            {/* future: <Link href="/dashboard/reviews" className="hover:text-white">Reseñas</Link> */}
            {/* future: <Link href="/dashboard/campaigns" className="hover:text-white">Campañas</Link> */}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {email && <span className="hidden sm:inline text-xs text-zinc-300">{email}</span>}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
