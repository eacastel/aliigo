"use client";

import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-semibold">
            Aliigo
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {/* Invitación como CTA principal */}
            <Link
              href="/signup"
              className="bg-white text-black px-3 py-1.5 rounded-md hover:bg-zinc-100"
            >
              Solicitar invitación
            </Link>
            {/* Si más adelante quieres login público, lo reactivamos aquí */}
            {/* <Link href="/login" className="text-zinc-300 hover:text-white">
              Acceso clientes
            </Link> */}
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
