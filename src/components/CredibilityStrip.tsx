"use client";

import { useTranslations } from "next-intl";

export function CredibilityStrip() {
  const t = useTranslations("Landing.credibility");

  return (
    <section className="border-b border-white/5 bg-zinc-950/80">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm text-zinc-300/90">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/40 px-4 py-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#84c9ad]" />
              <span className="font-medium text-zinc-200">{t(`item${i}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
