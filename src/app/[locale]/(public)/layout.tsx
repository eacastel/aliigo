// src/app/[locale]/(public)/layout.tsx

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PublicAuthActions from "@/components/PublicAuthActions";
import PublicTrackingEvents from "@/components/PublicTrackingEvents";
import PublicGetStartedButton from "@/components/PublicGetStartedButton";
import PublicMobileMenu from "@/components/PublicMobileMenu";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Navigation");
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-[#84c9ad]/30">
      <PublicTrackingEvents />
      
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
            <Link
              href="/why-aliigo"
              className="hidden md:block text-zinc-400 hover:text-white transition-colors"
            >
              {t("publicLinks.whyAliigo")}
            </Link>
            <Link
              href="/founder"
              className="hidden md:block text-zinc-400 hover:text-white transition-colors"
            >
              {t("publicLinks.founder")}
            </Link>

            <PublicAuthActions className="hidden md:flex items-center gap-3" />

            {/* Compact button on mobile */}
            <PublicGetStartedButton
              className="bg-white text-black px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md hover:bg-[#84c9ad] transition-colors whitespace-nowrap"
              label={t("actions.getStarted")}
            />

            <PublicMobileMenu />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

     {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-12">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("footerCompany.title")}
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="/why-aliigo" className="hover:text-white transition-colors">{t("footerCompany.whyAliigo")}</Link></li>
                <li><Link href="/founder" className="hover:text-white transition-colors">{t("footerCompany.founder")}</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-white transition-colors">{t("footerCompany.privacy")}</Link></li>
                <li><Link href="/legal/dpa" className="hover:text-white transition-colors">{t("footerCompany.dpa")}</Link></li>
                <li><Link href="/legal/subprocessors" className="hover:text-white transition-colors">{t("footerCompany.subprocessors")}</Link></li>
                <li><a href="mailto:legal@aliigo.com" className="hover:text-white transition-colors">{t("footerCompany.contact")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("footerLinks.title")}
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="/legal/aviso-legal" className="hover:text-white transition-colors">{t("footerLinks.avisoLegal")}</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-white transition-colors">{t("footerLinks.cookies")}</Link></li>
                <li><Link href="/legal/terminos" className="hover:text-white transition-colors">{t("footerLinks.terminos")}</Link></li>
                <li><Link href="/legal/subscription-agreement" className="hover:text-white transition-colors">{t("footerLinks.subscriptionAgreement")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-xs leading-5 text-zinc-600">
              &copy; {new Date().getFullYear()} Aliigo — {t("footer")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
