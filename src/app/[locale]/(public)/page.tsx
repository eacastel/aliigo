// src/app/[locale]/(public)/page.tsx

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
import { getClientCurrency, type AliigoCurrency } from "@/lib/currency";
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
export default function HomePage() {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const heroQualifier = t("hero.qualifier");
  const [currency, setCurrency] = useState<AliigoCurrency>("EUR");

  useEffect(() => {
    const next = (getClientCurrency() ?? "EUR") as AliigoCurrency;
    setCurrency(next);
  }, []);

  const displayLocale = currency === "USD" ? "en-US" : locale;
  const priceFmt = new Intl.NumberFormat(displayLocale, { style: "currency", currency, maximumFractionDigits: 0 });
  const starterPrice = priceFmt.format(99);
  const growthPrice = priceFmt.format(149);
  const proPrice = priceFmt.format(349);

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
      <FitFilterSection />

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
                    <MailMinus size={18} />
                  </div>
                  <span className="text-zinc-700 font-medium">
                    {t("demo.feature3")}
                  </span>
                </div>
              </div>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 text-white px-8 py-4 text-base font-bold hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                {t("demo.cta")}
              </Link>
            </div>

            {/* RIGHT: THE STAGE */}
            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="relative rounded-[3rem] bg-zinc-900 border-[10px] border-zinc-900 shadow-[0_50px_100px_-20px_rgba(50,50,93,0.25)] overflow-hidden ring-1 ring-black/5 z-20 transform transition-transform hover:scale-[1.01] duration-500">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-zinc-900 rounded-b-xl z-30" />

                <div className="bg-white h-[650px] w-full flex flex-col relative pt-8">
                  {/* Status Bar Fake */}
                  <div className="px-6 flex justify-between items-center text-[10px] font-bold text-zinc-400 mb-2">
                    <span>{t("demo.phone.time")}</span>
                    <div className="flex gap-1">
                      <span>{t("demo.phone.statusConnection")}</span>
                      <span>{t("demo.phone.statusWifi")}</span>
                      <span>{t("demo.phone.statusBattery")}</span>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#84c9ad] to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        AI
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900">
                          {t("demo.phone.agentName")}
                        </div>
                        <div className="text-xs text-emerald-500 font-medium">
                          {t("demo.phone.agentSub")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Widget Area */}
                  <div className="flex-1 bg-zinc-700 relative overflow-hidden">
                    <HomepageAssistantDemo
                    />
                  </div>
                </div>
              </div>

              {/* Decorative elements behind the phone */}
              <div className="absolute top-20 -right-12 w-24 h-24 bg-[#84c9ad] rounded-2xl rotate-12 blur-sm opacity-20 z-0 animate-pulse" />
              <div className="absolute bottom-20 -left-12 w-32 h-32 bg-purple-400 rounded-full blur-xl opacity-20 z-0" />
            </div>
          </div>
        </div>
      </section>

      <BusinessImpactSection />

      <CredibilityStrip />

      {/* FOUNDER TRUST CARD */}
      <section className="bg-zinc-950/60">
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 md:p-6">
            <div className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-zinc-800 ring-1 ring-white/10 overflow-hidden">
                  <Image
                    src="/founder.png"
                    alt={t("founder.photoAlt")}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {t("founder.name")}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {t("founder.role")}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-white">
                  {t("founder.headline")}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {t("founder.body")}
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {t("founder.trust")}
                </p>
                <div>
                  <Link
                    href="/why-aliigo"
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950/40 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-900/70 transition-colors"
                  >
                    {t("founder.cta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKS WITH STRIP */}
      <section className="border-b border-white/5 bg-zinc-950/60">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <p className="text-xl md:text-2xl font-semibold text-white">
              {t("integrations.title")}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {t("integrations.note")}
            </p>
          </div>
          <WorksWithRow />
        </div>
      </section>

      {/* 4. FEATURES: The "Value" Grid */}
      <section className="py-24 bg-zinc-950 relative border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-4">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
                {t("featuresGrid.title")}
              </span>
            </h2>
            <p className="text-zinc-400 text-lg">
              {t("featuresGrid.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* CARD 1: KNOWLEDGE BASE (Span 2) */}
            <div className="md:col-span-2 group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 relative overflow-hidden hover:bg-zinc-900/60 transition-all duration-500">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Layers className="text-purple-400" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {t("featuresGrid.card1.title")}
                  </h3>
                  <p className="text-zinc-400 max-w-md">
                    {t("featuresGrid.card1.desc")}
                  </p>
                </div>

                {/* VISUAL: The "Syncing" UI */}
                <div className="relative w-full bg-zinc-950 border border-white/10 rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-zinc-500">
                      {t("featuresGrid.card1.syncLabel")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                          {t("featuresGrid.card1.tagUrl")}
                        </span>
                        yourwebsite.com/pricing
                      </div>
                      <span className="text-emerald-500 text-xs font-bold">
                        {t("featuresGrid.card1.imported")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                          {t("featuresGrid.card1.tagPdf")}
                        </span>
                        Q4_Service_Menu.pdf
                      </div>
                      <span className="text-emerald-500 text-xs font-bold">
                        {t("featuresGrid.card1.imported")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm opacity-50">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                          {t("featuresGrid.card1.tagDoc")}
                        </span>
                        Policy_Knowledge.docx
                      </div>
                      <span className="text-zinc-500 text-xs">
                        {t("featuresGrid.card1.scanning")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-500 pointer-events-none" />
            </div>

            {/* CARD 2: LEAD CAPTURE (Span 1) */}
            <div className="group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 relative overflow-hidden hover:bg-zinc-900/60 transition-all duration-500">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-transparent to-zinc-950/80 pointer-events-none z-0" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-[#84c9ad]/10 flex items-center justify-center mb-4 border border-[#84c9ad]/20 group-hover:scale-110 transition-transform duration-300">
                  <Target className="text-[#84c9ad]" size={24} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {t("featuresGrid.card2.title")}
                </h3>

                <p className="text-zinc-400 text-sm mb-6">
                  {t("featuresGrid.card2.desc")}
                </p>

                {/* VISUAL: The Notification Card */}
                <div className="bg-zinc-800/50 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg transform group-hover:-translate-y-1 transition-transform duration-500">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                      JS
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-400 mb-0.5">
                        {t("featuresGrid.card2.notifTitle")}
                      </div>
                      <div className="text-sm font-semibold text-white truncate">
                        John Smith
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        john@company.com
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#84c9ad]" />
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#84c9ad]/10 blur-[60px] rounded-full group-hover:bg-[#84c9ad]/20 transition-all duration-500 pointer-events-none" />
            </div>

            {/* CARD 3: SMART ACTIONS (Span 1) */}
            <div className="group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 relative overflow-hidden hover:bg-zinc-900/60 transition-all duration-500">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 border border-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                  <MousePointerClick className="text-orange-400" size={24} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {t("featuresGrid.card3.title")}
                </h3>

                <p className="text-zinc-400 text-sm mb-6">
                  {t("featuresGrid.card3.desc")}
                </p>

                {/* VISUAL: The Calendar Button UI */}
                <div className="mt-auto">
                  <div className="bg-zinc-950 border border-white/10 rounded-lg p-3 max-w-[80%] mb-3">
                    <div className="h-2 w-16 bg-zinc-800 rounded mb-2" />
                    <div className="h-2 w-24 bg-zinc-800 rounded" />
                  </div>

                  <div
                    className="w-2/3 rounded-lg py-2.5 px-4 flex items-center justify-center gap-2
            bg-zinc-800/50 backdrop-blur-md text-zinc-200 ring-1 ring-inset ring-zinc-700/60
             select-none pointer-events-none"
                  >
                    <span className="font-bold text-xs">
                      {t("featuresGrid.card3.cta")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-500/10 blur-[60px] rounded-full group-hover:bg-orange-500/20 transition-all duration-500 pointer-events-none" />
            </div>

            {/* CARD 4: ANALYTICS/SUMMARY (Span 2) */}
            <div className="md:col-span-2 group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 relative overflow-hidden hover:bg-zinc-900/60 transition-all duration-500 flex flex-col md:flex-row items-center gap-8">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-500 pointer-events-none" />

              <div className="flex-1 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Compass className="text-blue-400" size={24} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  {t("featuresGrid.card4.title")}
                </h3>

                <p className="text-zinc-400">{t("featuresGrid.card4.desc")}</p>
              </div>

              {/* VISUAL: Mini Chart */}
              <div className="w-full md:w-1/2 relative bg-zinc-950 border border-white/10 rounded-xl p-5 shadow-2xl">
                <div className="flex justify-between items-end h-24 gap-2">
                  {[30, 45, 35, 60, 50, 75, 90].map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-zinc-800 rounded-t-sm relative group-hover:bg-zinc-700 transition-colors overflow-hidden"
                    >
                      <div
                        className="absolute bottom-0 w-full bg-blue-500/80 transition-all duration-1000 ease-out"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-between text-[10px] text-zinc-500 font-mono uppercase">
                  <span>{t("featuresGrid.card4.chartMon")}</span>
                  <span>{t("featuresGrid.card4.chartSun")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="border-t border-b border-white/5 bg-zinc-950/70">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-lg font-semibold text-white text-center sm:text-left">
              {t("ctaBand.title")}
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all shadow-[0_0_20px_rgba(132,201,173,0.25)] w-full sm:w-auto"
            >
              {t("ctaBand.button")}
            </Link>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section
        id="how-it-works"
        className="py-24 bg-zinc-900/30 border-t border-white/5 relative"
      >
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
                {t("howItWorks.title")}
              </span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative group text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xl font-bold text-white mb-6 shadow-lg group-hover:border-[#84c9ad]/50 group-hover:text-[#84c9ad] transition-all duration-300">
                  {step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t(`howItWorks.step${step}.title`)}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed px-4">
                  {t(`howItWorks.step${step}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. NEW PRICING SECTION (Starter / Growth / Pro) */}
      <section className="py-24 border-t border-white/5 bg-zinc-950 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
                {t("pricing.title")}
              </span>
            </h2>

            <div className="inline-flex items-center gap-2 bg-[#84c9ad]/10 border border-[#84c9ad]/20 px-4 py-2 rounded-full text-[#84c9ad] text-sm font-semibold">
              <Sparkles size={16} className="fill-[#84c9ad]" />
              {t("pricing.badge")}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {t("pricing.badgeNote")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {/* PLAN 1: STARTER */}
            <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-8 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-zinc-800 rounded-lg text-white">
                  <Store size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t("pricing.starter.name")}
                </h3>
              </div>

              <p className="text-zinc-400 text-sm mb-6 h-10">
                {t("pricing.starter.subtitle")}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{starterPrice}</span>
                <span className="text-zinc-500"> {t("pricing.period")}</span>
              </div>

              <Link
                href={{ pathname: "/signup", query: { plan: "starter" } }}
                className="block w-full py-3 px-4 bg-zinc-800 text-white text-center rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-colors border border-white/5"
              >
                {t("pricing.starter.cta")}
              </Link>

              <div className="mt-8 pt-8 border-t border-white/5 flex-1">
                <ul className="space-y-4 text-sm text-zinc-400">
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.starter.features.f1")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.starter.features.f2")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.starter.features.f3")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.starter.features.f4")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.starter.features.f5")}
                  </li>
                </ul>
              </div>
            </div>

            {/* PLAN 2: GROWTH (Highlighted) */}
            <div className="flex flex-col relative rounded-2xl border-2 border-[#84c9ad] bg-zinc-900 p-8 shadow-2xl shadow-[#84c9ad]/10 lg:scale-105 z-10">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-4 w-auto">
                <div className="bg-[#84c9ad] text-black text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-lg">
                  {t("pricing.growth.tag")}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#84c9ad]/20 text-[#84c9ad] rounded-lg">
                  <Zap size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t("pricing.growth.name")}
                </h3>
              </div>

              <p className="text-zinc-300 text-sm mb-6 h-10">
                {t("pricing.growth.subtitle")}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{growthPrice}</span>
                <span className="text-zinc-500"> {t("pricing.period")}</span>
              </div>

              <Link
                href={{ pathname: "/signup", query: { plan: "growth" } }}
                className="block w-full py-3 px-4 bg-[#84c9ad] text-zinc-900 text-center rounded-lg text-sm font-bold hover:bg-[#73bba0] transition-colors shadow-lg shadow-[#84c9ad]/20"
              >
                {t("pricing.growth.cta")}
              </Link>

              <div className="mt-8 pt-8 border-t border-white/10 flex-1">
                <div className="text-xs font-semibold text-[#84c9ad] mb-4 uppercase tracking-wider">
                  {t("pricing.growth.plusLabel")}
                </div>

                <ul className="space-y-4 text-sm text-zinc-200">
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#84c9ad] shrink-0" />
                    {t("pricing.growth.features.f1")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#84c9ad] shrink-0" />
                    {t("pricing.growth.features.f2")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#84c9ad] shrink-0" />
                    {t("pricing.growth.features.f3")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#84c9ad] shrink-0" />
                    {t("pricing.growth.features.f4")}
                  </li>
                </ul>
              </div>
            </div>

            {/* PLAN 3: PRO */}
            <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-8 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-zinc-800 rounded-lg text-white">
                  <Building2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t("pricing.pro.name")}
                </h3>
              </div>

              <p className="text-zinc-400 text-sm mb-6 h-10">
                {t("pricing.pro.subtitle")}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-2xl font-semibold text-zinc-400 mr-1">
                    {t("pricing.from")}
                  </span>
                  <span className="text-4xl font-bold text-white">{proPrice}</span>
                </div>
              </div>

              <Link
                href={{ pathname: "/pricing", hash: "pro-contact" }}
                className="block w-full py-3 px-4 bg-zinc-800 text-white text-center rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-colors border border-white/5"
              >
                {t("pricing.pro.cta")}
              </Link>

              <div className="mt-8 pt-8 border-t border-white/5 flex-1">
                <div className="text-xs font-semibold text-zinc-500 mb-4 uppercase tracking-wider">
                  {t("pricing.pro.plusLabel")}
                </div>

                <ul className="space-y-4 text-sm text-zinc-400">
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.pro.features.f1")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.pro.features.f2")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.pro.features.f3")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                    {t("pricing.pro.features.f4")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
              {t("faq.title")}
            </span>
          </h2>
          <div className="space-y-4">
            {["q1", "q2", "q3", "q4", "q5"].map((q) => (
              <div
                key={q}
                className="rounded-2xl border border-white/5 bg-zinc-900/20 p-6 hover:bg-zinc-900/40 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2 flex items-start gap-3">
                  <span className="text-[#84c9ad] mt-1">?</span>
                  {t(`faq.${q}.q`)}
                </h3>
                <p className="text-zinc-400 text-sm pl-7 leading-relaxed">
                  {t(`faq.${q}.a`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 text-center border-t border-white/5 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <h2 className="text-3xl font-bold text-white mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
            {t("finalCta.title")}
          </span>
        </h2>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-8 py-4 text-base font-bold hover:bg-[#73bba0] transition-all shadow-[0_0_20px_rgba(132,201,173,0.25)]"
        >
          {t("finalCta.button")}
        </Link>
      </section>

      <HomeFloatingWidgetGate />
    </div>
  );
}
