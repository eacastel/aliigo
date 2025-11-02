// src/components/SiteHeaderPublic.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SiteHeaderPublic() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!ok) return;
      setEmail(data.user?.email ?? null);
    });
    return () => { ok = false; };
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold tracking-tight">Aliigo</Link>
        {email ? (
          <nav className="text-sm text-zinc-300 flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-white">Panel</Link>
            {/* keep auth in dashboard top bar only; optional logout here if you really want */}
          </nav>
        ) : (
          <nav className="text-sm text-zinc-300 flex items-center gap-4">
            <Link href="/login" className="hover:text-white">Iniciar sesión</Link>
            <Link href="/signup" className="hover:text-white">Crear cuenta</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
