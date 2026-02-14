"use client";

import { LineChart, Target, Handshake } from "lucide-react";
import { useTranslations } from "next-intl";

export function BusinessImpactSection() {
  const t = useTranslations("Landing.impact");
  const cards = [
    { key: "card1", icon: LineChart },
    { key: "card2", icon: Target },
    { key: "card3", icon: Handshake },
  ];

  return (
    <section className="border-b border-white/5 bg-zinc-950/70">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
              {t("title")}
            </span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:p-7 shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-[#84c9ad]">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-lg font-semibold text-white">
                  {t(`${card.key}.title`)}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  {t(`${card.key}.desc`)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
