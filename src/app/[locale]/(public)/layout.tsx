// src/app/[locale]/(public)/layout.tsx

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PublicAuthActions from "@/components/PublicAuthActions";
import { getCurrencyFromCookies } from "@/lib/currency";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Navigation");
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const locale = localeCookie.toUpperCase();
  const currency = getCurrencyFromCookies(cookieStore) ?? "EUR";
  const debugCountry = cookieStore.get("aliigo_country_debug")?.value;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-[#84c9ad]/30">
      
      {/* HEADER - NOW STICKY & GLASS */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md supports-backdrop-filter:bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* 1. Logo (Prevents shrinking) */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="sr-only">{t('brand')}</span>
            <Image
              src="/aliigo-logo-white.svg"
              alt="Aliigo Logo"
              width={100}
              height={32}
              priority
              className="w-24 sm:w-28" // Slightly smaller on very small phones
            />
          </Link>

          {/* 2. Navigation */}
          <nav className="flex items-center gap-3 sm:gap-6 text-sm">
            
            <LanguageSwitcher />

            {/* Hidden on mobile, visible on tablet+ */}
            <Link
              href="/pricing"
              className="hidden md:block text-zinc-400 hover:text-white transition-colors"
            >
              {t("publicLinks.pricing")}
            </Link>

            <PublicAuthActions className="hidden md:flex items-center gap-3" />

            {/* Compact button on mobile */}
            <Link
              href="/signup"
              className="bg-white text-black px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md hover:bg-zinc-200 transition-colors whitespace-nowrap"
            >
              {t('actions.getStarted')}
            </Link>

            <PublicAuthActions className="flex md:hidden items-center gap-3" />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

     {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-12">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col items-center">
          
          {/* Legal Links Row */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-6 text-xs font-medium text-zinc-500">
            <Link href="/legal/aviso-legal" className="hover:text-zinc-300 transition-colors">
              {t('footerLinks.avisoLegal')}
            </Link>
            <Link href="/legal/privacidad" className="hover:text-zinc-300 transition-colors">
              {t('footerLinks.privacidad')}
            </Link>
            <Link href="/legal/cookies" className="hover:text-zinc-300 transition-colors">
              {t('footerLinks.cookies')}
            </Link>
            <Link href="/legal/terminos" className="hover:text-zinc-300 transition-colors">
              {t('footerLinks.terminos')}
            </Link>
          </div>

          <div className="text-center">
             <p className="text-xs leading-5 text-zinc-600">
               &copy; {new Date().getFullYear()} Aliigo — {t('footer')}
             </p>
            {debugCountry ? (
              <p className="mt-2 text-[11px] text-zinc-500">
                Locale: {locale.toUpperCase()} · Country: {debugCountry} · Currency: {currency}
              </p>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
