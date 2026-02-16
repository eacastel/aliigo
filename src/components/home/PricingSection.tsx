"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Building2, CheckCircle2, Sparkles, Store, Zap } from "lucide-react";

type PricingSectionProps = {
  starterPrice: string;
  growthPrice: string;
  proPrice: string;
};

export function PricingSection({ starterPrice, growthPrice, proPrice }: PricingSectionProps) {
  const t = useTranslations("Landing");

  return (
    <section className="py-20 md:py-24 border-t border-white/5 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
              {t("pricing.title")}
            </span>
          </h2>

          <div className="inline-flex items-center gap-2 bg-[#84c9ad]/10 border border-[#84c9ad]/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[#84c9ad] text-xs md:text-sm font-semibold">
            <Sparkles size={16} className="fill-[#84c9ad]" />
            {t("pricing.badge")}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {t("pricing.badgeNote")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
          {/* PLAN 1: STARTER */}
          <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-5 sm:p-6 lg:p-8 hover:border-white/10 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-800 rounded-lg text-white">
                <Store size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t("pricing.starter.name")}
              </h3>
            </div>

            <p className="text-zinc-400 text-sm mb-5 md:mb-6 min-h-[2.5rem] md:h-10">
              {t("pricing.starter.subtitle")}
            </p>

            <div className="mb-5 md:mb-6">
              <span className="text-3xl md:text-4xl font-bold text-white">{starterPrice}</span>
              <span className="text-zinc-500"> {t("pricing.period")}</span>
            </div>

            <Link
              href={{ pathname: "/signup", query: { plan: "starter" } }}
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

          {/* PLAN 2: GROWTH (Highlighted) */}
          <div className="flex flex-col relative rounded-2xl border-2 border-[#84c9ad] bg-zinc-900 p-5 sm:p-6 lg:p-8 shadow-2xl shadow-[#84c9ad]/10 lg:scale-105 z-10">
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

            <p className="text-zinc-300 text-sm mb-5 md:mb-6 min-h-[2.5rem] md:h-10">
              {t("pricing.growth.subtitle")}
            </p>

            <div className="mb-5 md:mb-6">
              <span className="text-3xl md:text-4xl font-bold text-white">{growthPrice}</span>
              <span className="text-zinc-500"> {t("pricing.period")}</span>
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

          {/* PLAN 3: PRO */}
          <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-5 sm:p-6 lg:p-8 hover:border-white/10 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-800 rounded-lg text-white">
                <Building2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t("pricing.pro.name")}
              </h3>
            </div>

            <p className="text-zinc-400 text-sm mb-5 md:mb-6 min-h-[2.5rem] md:h-10">
              {t("pricing.pro.subtitle")}
            </p>

            <div className="mb-5 md:mb-6">
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold text-zinc-400 mr-1">
                  {t("pricing.from")}
                </span>
                <span className="text-3xl md:text-4xl font-bold text-white">{proPrice}</span>
              </div>
            </div>

            <Link
              href={{ pathname: "/pricing", hash: "pro-contact" }}
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
        </div>
      </div>
    </section>
  );
}
