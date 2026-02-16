"use client";

import { useTranslations } from "next-intl";

export function FaqSection() {
  const t = useTranslations("Landing");

  return (
    <section id="faq" className="py-24 bg-zinc-950 scroll-mt-24">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
            {t("faq.title")}
          </span>
        </h2>
        <div className="space-y-4">
          {(["q1", "q2", "q3", "q4", "q5"] as const).map((q) => (
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
  );
}
