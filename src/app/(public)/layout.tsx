"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => { (async () => {
    const { data } = await supabase.auth.getSession();
    setEmail(data.session?.user?.email ?? null);
  })(); }, []);

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-semibold">Aliigo</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-zinc-300 hover:text-white">Panel</Link>
            {email ? (
              <button onClick={logout} className="text-zinc-300 hover:text-white">Cerrar sesión</button>
            ) : (
              <>
                <Link href="/login" className="text-zinc-300 hover:text-white">Iniciar sesión</Link>
                <Link href="/signup" className="bg-white text-black px-3 py-1.5 rounded-md hover:bg-zinc-100">Crear cuenta</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-zinc-950 border-t border-zinc-800 py-5 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Aliigo — Todos los derechos reservados.
      </footer>
    </div>
  );
}
