// src/app/[locale]/(public)/layout.tsx

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import PublicTrackingEvents from "@/components/PublicTrackingEvents";
import PublicHeaderNav from "@/components/PublicHeaderNav";
import { HomeFloatingWidgetGate } from "@/components/home/FloatingWidgetGate";

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
          <PublicHeaderNav
            pricingLabel={t("publicLinks.pricing")}
            whyAliigoLabel={t("publicLinks.whyAliigo")}
            getStartedLabel={t("actions.getStarted")}
          />
        </div>
      </header>

      <main className="flex-1">{children}</main>

     {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-12">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl grid gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("footerCompany.title")}
              </h4>
              <ul className="hidden md:block space-y-2 text-sm text-zinc-400">
                <li><Link href="/why-aliigo" className="hover:text-white transition-colors">{t("footerCompany.whyAliigo")}</Link></li>
                <li><Link href="/founder" className="hover:text-white transition-colors">{t("footerCompany.founder")}</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-white transition-colors">{t("footerCompany.privacy")}</Link></li>
                <li><Link href="/legal/eliminacion-datos" className="hover:text-white transition-colors">{t("footerCompany.dataDeletion")}</Link></li>
                <li><Link href="/legal/dpa" className="hover:text-white transition-colors">{t("footerCompany.dpa")}</Link></li>
                <li><Link href="/legal/subprocessors" className="hover:text-white transition-colors">{t("footerCompany.subprocessors")}</Link></li>
                <li><a href="mailto:legal@aliigo.com" className="hover:text-white transition-colors">{t("footerCompany.contact")}</a></li>
              </ul>
              <div className="md:hidden text-sm text-zinc-400 leading-7">
                <Link href="/why-aliigo" className="hover:text-white transition-colors">{t("footerCompany.whyAliigo")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/founder" className="hover:text-white transition-colors">{t("footerCompany.founder")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/legal/privacidad" className="hover:text-white transition-colors">{t("footerCompany.privacy")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/legal/eliminacion-datos" className="hover:text-white transition-colors">{t("footerCompany.dataDeletion")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/legal/dpa" className="hover:text-white transition-colors">{t("footerCompany.dpa")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/legal/subprocessors" className="hover:text-white transition-colors">{t("footerCompany.subprocessors")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <a href="mailto:legal@aliigo.com" className="hover:text-white transition-colors">{t("footerCompany.contact")}</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("footerLinks.title")}
              </h4>
              <ul className="hidden md:block space-y-2 text-sm text-zinc-400">
                <li><Link href="/legal/aviso-legal" className="hover:text-white transition-colors">{t("footerLinks.avisoLegal")}</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-white transition-colors">{t("footerLinks.cookies")}</Link></li>
                <li><Link href="/legal/terminos" className="hover:text-white transition-colors">{t("footerLinks.terminos")}</Link></li>
                <li><Link href="/legal/eliminacion-datos" className="hover:text-white transition-colors">{t("footerLinks.dataDeletion")}</Link></li>
                <li><Link href="/legal/subscription-agreement" className="hover:text-white transition-colors">{t("footerLinks.subscriptionAgreement")}</Link></li>
              </ul>
              <div className="md:hidden text-sm text-zinc-400 leading-7">
                <Link href="/legal/aviso-legal" className="hover:text-white transition-colors">{t("footerLinks.avisoLegal")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/legal/cookies" className="hover:text-white transition-colors">{t("footerLinks.cookies")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/legal/terminos" className="hover:text-white transition-colors">{t("footerLinks.terminos")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/legal/eliminacion-datos" className="hover:text-white transition-colors">{t("footerLinks.dataDeletion")}</Link>
                <span className="px-2 text-zinc-600">|</span>
                <Link href="/legal/subscription-agreement" className="hover:text-white transition-colors">{t("footerLinks.subscriptionAgreement")}</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-xs leading-5 text-zinc-600">
              &copy; {new Date().getFullYear()} Aliigo — {t("footer")}
            </p>
          </div>
        </div>
      </footer>

      <HomeFloatingWidgetGate />
    </div>
  );
}
