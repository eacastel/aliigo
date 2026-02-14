// src/app/[locale]/(public)/HomePageClient.tsx

"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import HeroRotator from "@/components/HeroRotator";
import { HomepageAssistantDemo } from "@/components/HomepageAssistantDemo";
import { AliigoSupportWidget } from "@/components/AliigoSupportWidget";
import { WorksWithRow } from "@/components/WorksWithRow";
import { ClaritySection } from "@/components/ClaritySection";
import { FitFilterSection } from "@/components/FitFilterSection";
import { CredibilityStrip } from "@/components/CredibilityStrip";
import { BusinessImpactSection } from "@/components/BusinessImpactSection";
import { type AliigoCurrency } from "@/lib/currency";
import {
  Layers,
  Target,
  MailMinus,
  Compass,
  MousePointerClick,
  CheckCircle2,
  Zap,
  Sparkles,
  Building2,
  Store,
} from "lucide-react";

type HomePageClientProps = {
  initialCurrency: AliigoCurrency;
};

// --- HELPER COMPONENT: Floating Widget Logic ---
function HomeFloatingWidgetGate() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let obs: IntersectionObserver | null = null;
    let intervalId: number | null = null;
    let mounted = true;

    const attach = (el: Element) => {
      obs = new IntersectionObserver(
        ([entry]) => {
          // hide floating widget while demo is on screen
          const demoVisible =
            entry.isIntersecting && entry.intersectionRatio > 0.25;
          if (mounted) setShow(!demoVisible);
        },
        { threshold: [0, 0.25, 0.5, 1] },
      );
      obs.observe(el);
    };

    const tryAttach = () => {
      const el = document.getElementById("homepage-assistant-demo");
      if (!el) return false;
      attach(el);
      return true;
    };

    if (!tryAttach()) {
      // Demo renders after token fetch; retry briefly
      const start = Date.now();
      intervalId = window.setInterval(() => {
        if (tryAttach() || Date.now() - start > 10_000) {
          if (intervalId) window.clearInterval(intervalId);
          intervalId = null;
        }
      }, 300);
    }

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
      obs?.disconnect();
    };
  }, []);

  if (!show) return null;

  return (
    <AliigoSupportWidget />
  );
}

// --- MAIN PAGE COMPONENT ---
export default function HomePageClient({ initialCurrency }: HomePageClientProps) {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const heroQualifier = t("hero.qualifier");
  const [currency] = useState<AliigoCurrency>(initialCurrency);

  const displayLocale = currency === "USD" ? "en-US" : locale;
  const priceFmt = new Intl.NumberFormat(displayLocale, { style: "currency", currency, maximumFractionDigits: 0 });
  const starterPrice = priceFmt.format(99);
  const growthPrice = priceFmt.format(149);
  const proPrice = priceFmt.format(349);
  const fitValue = priceFmt.format(500);

  return (
    <div className="bg-zinc-950 overflow-hidden selection:bg-[#84c9ad]/30">
      {/* 1. HERO SECTION */}
      <section className="relative pt-14 pb-18 lg:pt-20 lg:pb-24 border-b border-white/5">
        <div className="absolute top-0 right-0 -z-10 opacity-20 blur-[100px] pointer-events-none">
          <div className="w-[500px] h-[500px] bg-[#84c9ad] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84c9ad]/10 border border-[#84c9ad]/20 text-[#84c9ad] text-xs font-medium mb-6">
                ✨ {t("hero.betaNote")}
              </div>

              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-zinc-500 mb-3">
                {t("hero.microline")}
              </p>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                {t("hero.title")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84c9ad] to-emerald-400">
                  {t("hero.titleHighlight")}
                </span>
              </h1>

              <p className="mt-6 text-lg text-zinc-400 leading-relaxed max-w-lg">
                {t("hero.subtitle")}
              </p>

              {heroQualifier?.trim() ? (
                <p className="mt-3 text-sm text-zinc-500 leading-relaxed max-w-lg">
                  {heroQualifier}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all shadow-[0_0_20px_rgba(132,201,173,0.3)]"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href={{ pathname: "/", hash: "assistant-demo" }}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>

            </div>

            <div className="relative">
              <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-2 shadow-2xl ring-1 ring-white/10">
                <HeroRotator />
              </div>
              <div className="absolute -inset-1 -z-10 bg-gradient-to-tr from-[#84c9ad] to-blue-600 opacity-20 blur-xl rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      <ClaritySection />
      <FitFilterSection value={fitValue} />

      {/* 2. SUPERCHARGED LIVE DEMO SECTION */}
      <section
        id="assistant-demo"
        className="relative py-24 overflow-hidden bg-[#F0F4F8]"
      >
        {/* Background Mesh Gradients */}
        <div className="absolute top-0 inset-x-0 h-full w-full overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-200 rounded-full blur-[120px] opacity-40 mix-blend-multiply animate-pulse" />
          <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#84c9ad] rounded-full blur-[120px] opacity-30 mix-blend-multiply" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT: COPY */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-900 text-xs font-bold mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {t("demo.badge")}
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 leading-[1.1] mb-6 tracking-tight">
                {t("demo.headlineLine1")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  {t("demo.headlineEmphasis")}
                </span>
              </h2>

              <p className="text-lg text-zinc-600 leading-relaxed mb-8 font-medium">
                {t("demo.subtitle")}
              </p>

              {/* Call out specific features visible in the demo */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100 text-emerald-600">
                    <Layers size={18} />
                  </div>
                  <span className="text-zinc-700 font-medium">
                    {t("demo.feature1")}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-zinc-700 font-medium">
                    {t("demo.feature2")}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100 text-emerald-600">
                    <Compass size={18} />
                  </div>
                  <span className="text-zinc-700 font-medium">
                    {t("demo.feature3")}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: DEMO COMPONENT */}
            <HomepageAssistantDemo />
          </div>
        </div>
      </section>

      <BusinessImpactSection />

      {/* 4. HOW IT WORKS SECTION */}
      <section
        id="features"
        className="py-24 bg-zinc-950 border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-16">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84c9ad] to-emerald-400">
              {t("howItWorks.title")}
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 mb-4">
                <Sparkles size={22} />
              </div>
              <h3 className="text-white font-semibold mb-2">{t("featuresGrid.card1.title")}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t("featuresGrid.card1.desc")}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 mb-4">
                <Building2 size={22} />
              </div>
              <h3 className="text-white font-semibold mb-2">{t("featuresGrid.card2.title")}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t("featuresGrid.card2.desc")}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 mb-4">
                <Store size={22} />
              </div>
              <h3 className="text-white font-semibold mb-2">{t("featuresGrid.card3.title")}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t("featuresGrid.card3.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <CredibilityStrip />
      <WorksWithRow />

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="py-24 border-t border-white/5 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84c9ad]/10 border border-[#84c9ad]/20 text-[#84c9ad] text-xs font-medium mb-6">
            {t("pricing.badge")}
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84c9ad] to-emerald-400">
              {t("pricing.title")}
            </span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-16">
            {t("pricing.badgeNote")}
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {/* Starter */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-8 shadow-xl">
              <h3 className="text-white text-xl font-semibold mb-3">
                {t("pricing.starter.name")}
              </h3>
              <p className="text-4xl font-bold text-white mb-4">
                {starterPrice} <span className="text-sm text-zinc-400">/mo</span>
              </p>
              <p className="text-sm text-zinc-400 mb-6">
                {t("pricing.starter.subtitle")}
              </p>
              <ul className="space-y-3 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.starter.features.f1")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.starter.features.f2")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.starter.features.f3")}
                </li>
              </ul>
            </div>

            {/* Growth */}
            <div className="rounded-2xl border border-[#84c9ad]/40 bg-[#84c9ad]/10 p-8 shadow-xl">
              <div className="text-xs font-semibold text-[#84c9ad] uppercase tracking-widest mb-2">
                {t("pricing.growth.tag")}
              </div>
              <h3 className="text-white text-xl font-semibold mb-3">
                {t("pricing.growth.name")}
              </h3>
              <p className="text-4xl font-bold text-white mb-4">
                {growthPrice} <span className="text-sm text-zinc-400">/mo</span>
              </p>
              <p className="text-sm text-zinc-400 mb-6">
                {t("pricing.growth.subtitle")}
              </p>
              <ul className="space-y-3 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.growth.features.f1")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.growth.features.f2")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.growth.features.f3")}
                </li>
              </ul>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-8 shadow-xl">
              <h3 className="text-white text-xl font-semibold mb-3">
                {t("pricing.pro.name")}
              </h3>
              <p className="text-4xl font-bold text-white mb-4">
                {proPrice}+ <span className="text-sm text-zinc-400">/mo</span>
              </p>
              <p className="text-sm text-zinc-400 mb-6">
                {t("pricing.pro.subtitle")}
              </p>
              <ul className="space-y-3 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.pro.features.f1")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.pro.features.f2")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#84c9ad]" />
                  {t("pricing.pro.features.f3")}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA SECTION */}
      <section className="py-24 border-t border-white/5 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            {t("finalCta.title")}
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-8">
            {t("hero.subtitle")}
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-8 py-4 text-sm font-semibold hover:bg-[#73bba0] transition-all shadow-[0_0_30px_rgba(132,201,173,0.4)]"
          >
            {t("finalCta.button")}
          </Link>
        </div>
      </section>

      <HomeFloatingWidgetGate />
    </div>
  );
}
