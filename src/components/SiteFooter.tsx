import Link from "next/link";

const COMPANY = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Aliigo";
const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "soporte@aliigo.com";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-3">Producto</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard" className="hover:text-white">Panel</Link></li>
            <li><span className="text-zinc-500">Reseñas (próximamente)</span></li>
            <li><span className="text-zinc-500">Campañas SMS (próximamente)</span></li>
            <li><span className="text-zinc-500">Chat IA (próximamente)</span></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-3">Compañía</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">Inicio</Link></li>
            <li><a href={`mailto:${SUPPORT}`} className="hover:text-white">Soporte</a></li>
            <li><span className="text-zinc-500">Blog (próximamente)</span></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-3">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/legal/privacidad" className="hover:text-white">Privacidad</Link></li>
            <li><Link href="/legal/terminos" className="hover:text-white">Términos</Link></li>
            <li><Link href="/legal/cookies" className="hover:text-white">Cookies</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} {COMPANY}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-zinc-500">
            Soporte: <a className="hover:text-white" href={`mailto:${SUPPORT}`}>{SUPPORT}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
