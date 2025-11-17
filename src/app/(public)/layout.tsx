"use client";

import Link from "next/link";
import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              href="/signup"
              className="bg-white text-black px-3 py-1.5 rounded-md hover:bg-zinc-100"
            >
              Solicitar invitación
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-5 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Aliigo — Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
