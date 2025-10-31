"use client";
import Link from "next/link";

export default function SiteHeaderPublic() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold tracking-tight">Aliigo</Link>
        <nav className="text-sm text-zinc-300 flex items-center gap-4">
          <Link href="/login" className="hover:text-white">Iniciar sesión</Link>
          <Link href="/signup" className="hover:text-white">Crear cuenta</Link>
        </nav>
      </div>
    </header>
  );
}
