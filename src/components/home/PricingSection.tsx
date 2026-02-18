"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import { PricingCards } from "@/components/home/PricingCards";
import { Link } from "@/i18n/routing";

type PricingSectionProps = {
  basicPrice: string;
  growthPrice: string;
  proPrice: string;
  customPrice: string;
};

export function PricingSection({ basicPrice, growthPrice, proPrice, customPrice }: PricingSectionProps) {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const isEs = locale.startsWith("es");

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
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            <Link
              href={{ pathname: "/pricing", hash: "plans-matrix" }}
              className="rounded-md border border-white/15 px-3 py-1.5 font-medium text-zinc-200 transition hover:border-white/30 hover:text-white"
            >
              {isEs ? "Comparar planes" : "Compare plans"}
            </Link>
          </div>
        </div>

        <PricingCards
          basicPrice={basicPrice}
          growthPrice={growthPrice}
          proPrice={proPrice}
          customPrice={customPrice}
        />
      </div>
    </section>
  );
}
