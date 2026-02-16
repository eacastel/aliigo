"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { HeroGhostPreview } from "@/components/home/HeroGhostPreview";

type LpHeroSectionProps = {
  startingPrice: string;
};

export function LpHeroSection({ startingPrice }: LpHeroSectionProps) {
  const t = useTranslations("LandingLP");

  return (
    <section className="relative border-b border-white/5 pt-10 pb-12 sm:pt-12 sm:pb-14 lg:pt-20 lg:pb-24">
      <div className="absolute top-0 right-0 -z-10 opacity-20 blur-[100px] pointer-events-none">
        <div className="w-[500px] h-[500px] bg-[#84c9ad] rounded-full mix-blend-screen" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84c9ad]/10 border border-[#84c9ad]/20 text-[#84c9ad] text-xs font-medium mb-6">
              {t("hero.badge")}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              {t("hero.title")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84c9ad] to-emerald-400">
                {t("hero.titleHighlight")}
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-lg">
              {t("hero.subtitle")}
            </p>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-lg">
              {t("hero.chatbotLine")}
            </p>

            <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-zinc-900/60 px-3 py-1 text-xs font-semibold text-zinc-200">
              {t("hero.priceCue", { price: startingPrice })}
            </div>

            <ul className="mt-5 space-y-2 text-sm text-zinc-300">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#84c9ad]" />
                  <span>{t(`hero.bullet${i}`)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/signup"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all shadow-[0_0_20px_rgba(132,201,173,0.3)]"
              >
                {t("hero.ctaPrimary")}
              </Link>
              <a
                href="#pricing"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
              >
                {t("hero.ctaSecondary")}
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-2 shadow-2xl ring-1 ring-white/10">
              <HeroGhostPreview trackEventName="lp_try_questions_click" />
            </div>
            <div className="absolute -inset-1 -z-10 bg-gradient-to-tr from-[#84c9ad] to-blue-600 opacity-20 blur-xl rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
