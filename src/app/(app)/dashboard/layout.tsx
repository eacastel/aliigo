"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const nav = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/settings", label: "Negocio" },
  { href: "/dashboard/widget", label: "Widget" },
  { href: "/dashboard/billing", label: "Facturación" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
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

      {/* HEADER */}
      <header className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 pb-4  pt-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/aliigo-logo-white.svg"
              alt="Aliigo"
              width={120}
              height={36}
              priority
            />
            <span className="sr-only">Aliigo</span>
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
              <Link href="/login" className="text-zinc-300 hover:text-white">
                Iniciar sesión
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 grid grid-cols-12">
        
        {/* SIDEBAR */}
        <aside className="col-span-12 sm:col-span-3 lg:col-span-2 border-r border-zinc-800 bg-zinc-950">
          <div className="px-4 py-4 border-b border-zinc-800">
            <div className="text-xs text-zinc-500">Dashboard</div>
          </div>
          <nav className="p-3 space-y-1">
            {nav.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={[
                    "block px-3 py-2 rounded text-sm",
                    active
                      ? "bg-zinc-900 text-white border border-zinc-800"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-900/60",
                  ].join(" ")}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="col-span-12 sm:col-span-9 lg:col-span-10">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>

      </div>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-5 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Aliigo — Todos los derechos reservados.
        </div>
      </footer>

    </div>
  );
}
