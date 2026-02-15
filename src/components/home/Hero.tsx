"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import HeroRotator from "@/components/HeroRotator";

export function HomeHeroSection() {
  const t = useTranslations("Landing");
  const heroQualifier = t("hero.qualifier");

  return (
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

            <p className="mt-3 text-sm text-zinc-500 leading-relaxed max-w-xl">
              {t("hero.trustLine")}
            </p>
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
  );
}
