// src/app/[locale]/(public)/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import HeroRotator from "@/components/HeroRotator";
import { HomepageAssistantDemo } from "@/components/HomepageAssistantDemo";
import { AliigoSupportWidget } from "@/components/AliigoSupportWidget";
import {
  HelpCircle,
  Layers,
  Target,
  MailMinus,
  Compass,
  MousePointerClick,
} from "lucide-react";

function HomeFloatingWidgetGate() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const el = document.getElementById("homepage-assistant-demo");
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        // hide floating widget while demo is on screen
        const demoVisible = entry.isIntersecting && entry.intersectionRatio > 0.25;
        setShow(!demoVisible);
      },
      { threshold: [0, 0.25, 0.5, 1] }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!show) return null;

  return (
    <div id="aliigo-widget">
      <AliigoSupportWidget />
    </div>
  );
}


export default function HomePage() {
  const t = useTranslations("Landing");

  const industries = [
    { id: "preContact", icon: HelpCircle },
    { id: "complexServices", icon: Layers },
    { id: "qualifyIntent", icon: Target },
    { id: "reduceNoise", icon: MailMinus },
    { id: "highValue", icon: Compass },
    { id: "nextStep", icon: MousePointerClick },
  ];

  return (
    <div className="bg-zinc-950 overflow-hidden selection:bg-[#84c9ad]/30">
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 border-b border-white/5">
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

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all shadow-[0_0_20px_rgba(132,201,173,0.3)]"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="#how-it-works"
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

      {/* HERO DEMO – VISUAL MOCK ONLY */}
      <section className="border-b border-white/5 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 -mt-10 pb-16">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm shadow-2xl ring-1 ring-white/10 p-6 md:p-8">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              {/* LEFT: COPY */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84c9ad]/10 border border-[#84c9ad]/20 text-[#84c9ad] text-xs font-medium mb-4">
                  {t("demo.badge")}
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  {t("demo.titleLine1")}
                  <br />
                  {t("demo.titleLine2")}
                </h3>

                <p className="mt-4 text-base text-zinc-400 max-w-lg">
                  {t("demo.subtitle")}
                </p>

                <p className="mt-6 text-sm text-zinc-500">
                  {t("demo.pricingPrefix")}{" "}
                  <span className="text-zinc-300 font-semibold">
                    {t("demo.price")}
                  </span>
                  {t("demo.pricingSuffix")}
                </p>

                {/* Example prompts (visual only) */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    t("demo.prompts.p1"),
                    t("demo.prompts.p2"),
                    t("demo.prompts.p3"),
                  ].map((q) => (
                    <span
                      key={q}
                      className="text-xs md:text-sm px-3 py-2 rounded-full border border-white/10 bg-zinc-950/40 text-zinc-300"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              {/* RIGHT: REAL EMBEDDED DEMO (in a box) */}
              <div className="w-full lg:max-w-[420px] lg:ml-auto">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/60 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    {/* LEFT: title + live dot */}
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      

                      
                    </div>

                    {/* RIGHT: tag */}
                    <div className="text-xs text-zinc-500 flex items-center gap-4">

                      
                       → {t("demo.liveTag")}
                      <span
                        className="relative inline-flex h-2.5 w-2.5"
                        aria-hidden="true"
                      >
                        {/* soft halo */}
                        <span className="absolute -inset-1.5 rounded-full bg-emerald-400/25 blur-[5px]" />
                        {/* subtle pulse ring (slower + lighter) */}
                        <span className="absolute -inset-1 rounded-full border border-emerald-400/25 animate-[ping_1.6s_ease-in-out_infinite]" />
                        {/* core dot */}
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]" />
                      </span>
                    </div>
                  </div>

                  {/* Widget box */}
                  <div className="p-3">
                    <HomepageAssistantDemo
                      brand="Aliigo"
                      businessSlug="aliigo"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INDUSTRY/SOCIAL PROOF (Clickable) */}
      <section className="border-b border-white/5 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <p className="text-center text-xs font-bold text-zinc-500 mb-8 uppercase tracking-widest">
            {t("socialProof.title")}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {industries.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  href="/signup"
                  key={item.id}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-950/50 border border-white/5 hover:border-[#84c9ad]/50 hover:bg-[#84c9ad]/10 transition-all duration-300 cursor-pointer"
                >
                  <Icon
                    className="w-6 h-6 mb-3 text-zinc-400 group-hover:text-[#84c9ad] group-hover:scale-110 transition-all duration-300"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors text-center">
                    {t(`socialProof.industries.${item.id}`)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID FEATURES (Clickable) */}
      <section className="py-24 bg-zinc-950 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t("features.title")}
            </h2>
            <p className="text-zinc-400">{t("features.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Big Card (Chat UI Simulation) */}
            <Link
              href="/signup"
              className="md:col-span-2 rounded-3xl border border-white/10 bg-zinc-900/50 p-8 relative overflow-hidden group hover:border-[#84c9ad]/50 transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                <div className="w-32 h-32 bg-[#84c9ad] blur-[60px] rounded-full" />
              </div>

              <div className="relative z-10 mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t("features.f1.title")}
                </h3>
                <p className="text-zinc-400 max-w-sm group-hover:text-zinc-300 transition-colors">
                  {t("features.f1.desc")}
                </p>
              </div>

              <div className="relative w-full max-w-md ml-auto mt-auto translate-y-4 translate-x-4">
                <div className="w-full bg-zinc-950 border border-white/10 rounded-tl-xl rounded-tr-xl shadow-2xl p-4 space-y-3 group-hover:border-[#84c9ad]/20 transition-colors">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
                    <div className="bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-2 text-xs text-zinc-300">
                      <div className="h-2 w-24 bg-zinc-700 rounded mb-1.5 opacity-50"></div>
                      <div className="h-2 w-16 bg-zinc-700 rounded opacity-50"></div>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-[#84c9ad] flex items-center justify-center text-zinc-900 text-[10px] font-bold flex-shrink-0">
                      AI
                    </div>
                    <div className="bg-[#84c9ad]/10 border border-[#84c9ad]/20 rounded-2xl rounded-tr-none px-4 py-2 text-xs text-[#84c9ad]">
                      <div className="h-2 w-32 bg-[#84c9ad] rounded mb-1.5 opacity-40"></div>
                      <div className="h-2 w-20 bg-[#84c9ad] rounded opacity-40"></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex gap-2">
                    <div className="h-8 flex-1 bg-zinc-900 rounded-full border border-white/5" />
                    <div className="h-8 w-8 bg-[#84c9ad] rounded-full opacity-20" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Tall Card (Reviews) */}
            <Link
              href="/signup"
              className="md:row-span-2 rounded-3xl border border-white/10 bg-zinc-900/50 p-8 relative overflow-hidden group hover:border-yellow-500/50 transition-all cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
                <div className="w-32 h-32 bg-yellow-500 blur-[60px] rounded-full" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {t("features.f3.title")}
              </h3>
              <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {t("features.f3.desc")}
              </p>
              <div className="mt-8 space-y-3">
                {[5, 5, 4].map((stars, i) => (
                  <div
                    key={i}
                    className="p-3 bg-zinc-950/50 rounded-lg border border-white/5 group-hover:border-yellow-500/20 transition-colors"
                  >
                    <div className="flex gap-1 text-yellow-500 text-xs mb-1">
                      {"★".repeat(stars)}
                    </div>
                    <div className="h-2 w-20 bg-zinc-800 rounded mb-1" />
                    <div className="h-2 w-12 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </Link>

            {/* Small Card (Inbox) */}
            <Link
              href="/signup"
              className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 hover:bg-zinc-900 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                📥
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t("features.f2.title")}
              </h3>
              <p className="text-zinc-400 text-sm group-hover:text-zinc-300">
                {t("features.f2.desc")}
              </p>
            </Link>

            {/* Small Card (Campaigns) */}
            <Link
              href="/signup"
              className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 hover:bg-zinc-900 hover:border-[#84c9ad]/50 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#84c9ad]/20 flex items-center justify-center text-[#84c9ad] mb-4 group-hover:scale-110 transition-transform">
                🚀
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t("features.f4.title")}
              </h3>
              <p className="text-zinc-400 text-sm group-hover:text-zinc-300">
                {t("features.f4.desc")}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section
        id="how-it-works"
        className="py-24 bg-zinc-900/30 border-t border-white/5 relative"
      >
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t("howItWorks.title")}
            </h2>
            <p className="text-zinc-400">{t("howItWorks.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative group">
                {step !== 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-zinc-800 to-zinc-900 z-0" />
                )}

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xl font-bold text-white mb-6 shadow-lg group-hover:border-[#84c9ad]/50 group-hover:text-[#84c9ad] transition-all duration-300">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {t(`howItWorks.step${step}.title`)}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed px-4">
                    {t(`howItWorks.step${step}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRICING */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="rounded-3xl bg-zinc-900 border border-white/10 p-1 lg:p-2 flex flex-col md:flex-row gap-8 items-center overflow-hidden">
            <div className="flex-1 p-8 md:p-12 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-4">
                {t("pricing.title")}
              </h2>
              <p className="text-zinc-400 mb-6">{t("pricing.desc")}</p>
              <ul className="space-y-3 text-sm text-zinc-300 text-left mx-auto max-w-xs md:mx-0">
                <li className="flex items-center gap-2">
                  <span className="text-[#84c9ad]">✓</span> 1 User Included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#84c9ad]">✓</span> AI Chatbot (ample
                  allowance)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#84c9ad]">✓</span> Google Review Sync
                </li>
              </ul>
            </div>

            <div className="w-full md:w-80 bg-[#84c9ad] rounded-2xl p-8 text-center text-zinc-900 flex flex-col justify-center min-h-[300px]">
              <div className="text-sm font-bold uppercase tracking-wide opacity-80 mb-2">
                Beta Access
              </div>
              <div className="text-6xl font-extrabold mb-1">
                {t("pricing.price")}
              </div>
              <div className="opacity-80 mb-8 font-medium">
                {t("pricing.period")}
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
              >
                {t("pricing.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            {t("faq.title")}
          </h2>

          <div className="space-y-4">
            {["q1", "q2", "q3", "q4"].map((q) => (
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
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          {t("finalCta.title")}
        </h2>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg bg-white text-black px-8 py-4 text-base font-bold hover:bg-zinc-200 transition-all"
        >
          {t("finalCta.button")}
        </Link>
      </section>

      <HomeFloatingWidgetGate />
    </div>
  );
}
