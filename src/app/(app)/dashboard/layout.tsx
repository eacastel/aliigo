"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user?.email ?? null);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-white font-semibold tracking-tight text-lg hover:text-zinc-300"
          >
            Aliigo
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-zinc-300 hover:text-white transition"
            >
              Panel
            </Link>

            {email ? (
              <>
                <span className="text-zinc-500 text-xs hidden sm:inline">
                  {email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-zinc-300 hover:text-white transition"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-zinc-300 hover:text-white transition"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-black hover:bg-zinc-100 px-3 py-1.5 rounded-md font-medium"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-5 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Aliigo — Todos los derechos reservados.
      </footer>
    </div>
  );
}
