"use client";

import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { Building2, CheckCircle2, Store, Zap } from "lucide-react";

type PricingCardsProps = {
  basicPrice: string;
  growthPrice: string;
  proPrice: string;
  customPrice: string;
};

export function PricingCards({
  basicPrice,
  growthPrice,
  proPrice,
  customPrice,
}: PricingCardsProps) {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const isEs = locale.startsWith("es");
  const cardBase =
    "snap-start flex min-w-[280px] max-w-[320px] flex-col rounded-2xl border bg-zinc-900/20 p-5 sm:p-6 lg:p-8 transition-all";

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <div className="mb-2 flex items-center justify-between px-1 text-xs text-zinc-500">
          <span>{isEs ? "Desliza para ver más planes" : "Swipe to see more plans"}</span>
        </div>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
          <div className={`${cardBase} border-white/5 hover:border-white/10`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-zinc-800 rounded-lg text-white">
              <Store size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">{t("pricing.starter.name")}</h3>
          </div>

          <p className="text-zinc-400 text-sm mb-5 md:mb-6 min-h-[2.5rem] md:h-10">
            {t("pricing.starter.subtitle")}
          </p>

          <div className="mb-5 md:mb-6">
            <span className="text-3xl md:text-4xl font-bold text-white">{basicPrice}</span>
            <span className="text-zinc-500"> {t("pricing.period")}</span>
            <p className="mt-2 text-xs text-zinc-500">{isEs ? "Idiomas: No" : "Languages: No"}</p>
          </div>

          <Link
            href={{ pathname: "/signup", query: { plan: "basic" } }}
            className="block w-full py-2.5 md:py-3 px-4 bg-zinc-800 text-white text-center rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-colors border border-white/5"
          >
            {t("pricing.starter.cta")}
          </Link>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5 flex-1">
            <ul className="space-y-3 md:space-y-4 text-sm text-zinc-400">
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

        <div className="relative z-10 flex min-w-[280px] max-w-[320px] snap-start flex-col rounded-2xl border-2 border-[#84c9ad] bg-zinc-900 p-5 shadow-2xl shadow-[#84c9ad]/10 sm:p-6 lg:p-8">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-4 w-auto">
            <div className="bg-[#84c9ad] text-black text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-lg">
              {t("pricing.growth.tag")}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#84c9ad]/20 text-[#84c9ad] rounded-lg">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">{t("pricing.growth.name")}</h3>
          </div>

          <p className="text-zinc-300 text-sm mb-5 md:mb-6 min-h-[2.5rem] md:h-10">
            {t("pricing.growth.subtitle")}
          </p>

          <div className="mb-5 md:mb-6">
            <span className="text-3xl md:text-4xl font-bold text-white">{growthPrice}</span>
            <span className="text-zinc-500"> {t("pricing.period")}</span>
            <p className="mt-2 text-xs text-zinc-500">{isEs ? "Idiomas: ES, EN" : "Languages: ES, EN"}</p>
          </div>

          <Link
            href={{ pathname: "/signup", query: { plan: "growth" } }}
            className="block w-full py-2.5 md:py-3 px-4 bg-[#84c9ad] text-zinc-900 text-center rounded-lg text-sm font-bold hover:bg-[#73bba0] transition-colors shadow-lg shadow-[#84c9ad]/20"
          >
            {t("pricing.growth.cta")}
          </Link>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/10 flex-1">
            <div className="text-xs font-semibold text-[#84c9ad] mb-4 uppercase tracking-wider">
              {t("pricing.growth.plusLabel")}
            </div>

            <ul className="space-y-3 md:space-y-4 text-sm text-zinc-200">
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

        <div className={`${cardBase} border-white/5 hover:border-white/10`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-zinc-800 rounded-lg text-white">
              <Building2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">{t("pricing.pro.name")}</h3>
          </div>

          <p className="text-zinc-400 text-sm mb-5 md:mb-6 min-h-[2.5rem] md:h-10">
            {t("pricing.pro.subtitle")}
          </p>

          <div className="mb-5 md:mb-6">
            <span className="text-3xl md:text-4xl font-bold text-white">{proPrice}</span>
            <span className="text-zinc-500"> {t("pricing.period")}</span>
            <p className="mt-2 text-xs text-zinc-500">{isEs ? "Idiomas: ES, EN +1" : "Languages: ES, EN +1"}</p>
          </div>

          <Link
            href={{ pathname: "/signup", query: { plan: "pro" } }}
            className="block w-full py-2.5 md:py-3 px-4 bg-zinc-800 text-white text-center rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-colors border border-white/5"
          >
            {t("pricing.pro.cta")}
          </Link>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5 flex-1">
            <div className="text-xs font-semibold text-zinc-500 mb-4 uppercase tracking-wider">
              {t("pricing.pro.plusLabel")}
            </div>

            <ul className="space-y-3 md:space-y-4 text-sm text-zinc-400">
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
        <div className={`${cardBase} border-white/5 hover:border-white/10`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-zinc-800 rounded-lg text-white">
              <Building2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">{t("pricing.custom.name")}</h3>
          </div>

          <p className="text-zinc-400 text-sm mb-5 md:mb-6 min-h-[2.5rem] md:h-10">
            {t("pricing.custom.subtitle")}
          </p>

          <div className="mb-5 md:mb-6">
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-zinc-400 mr-1">{t("pricing.from")}</span>
              <span className="text-3xl md:text-4xl font-bold text-white">{customPrice}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {isEs ? "Idiomas: Multilingüe completo" : "Languages: Full multilingual"}
            </p>
          </div>

          <Link
            href={{ pathname: "/pricing", hash: "sales-contact" }}
            className="block w-full py-2.5 md:py-3 px-4 bg-zinc-800 text-white text-center rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-colors border border-white/5"
          >
            {t("pricing.custom.cta")}
          </Link>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5 flex-1">
            <div className="text-xs font-semibold text-zinc-500 mb-4 uppercase tracking-wider">
              {t("pricing.custom.plusLabel")}
            </div>

            <ul className="grid gap-3 text-sm text-zinc-400 md:grid-cols-2">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                {t("pricing.custom.features.f1")}
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                {t("pricing.custom.features.f2")}
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                {t("pricing.custom.features.f3")}
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-zinc-600 shrink-0" />
                {t("pricing.custom.features.f4")}
              </li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
