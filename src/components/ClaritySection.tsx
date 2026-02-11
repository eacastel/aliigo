"use client";

import { MessageCircle, Target, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export function ClaritySection() {
  const t = useTranslations("Landing.clarity");
  const cards = [
    { key: "card1", icon: MessageCircle },
    { key: "card2", icon: Target },
    { key: "card3", icon: Clock },
  ];

  return (
    <section className="border-b border-white/5 bg-zinc-950/80">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
            {t("title")}
          </span>
        </h2>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
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
                  {t(`${card.key}.benefit`)}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-sm md:text-base text-zinc-400">
          {t("note")}
        </p>
      </div>
    </section>
  );
}
