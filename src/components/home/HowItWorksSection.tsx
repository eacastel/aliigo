"use client";

import { useTranslations } from "next-intl";

export function HowItWorksSection() {
  const t = useTranslations("Landing");

  return (
    <section
      id="how-it-works"
      className="py-24 bg-zinc-900/30 border-t border-white/5 relative"
    >
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
              {t("howItWorks.title")}
            </span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="relative group text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xl font-bold text-white mb-6 shadow-lg group-hover:border-[#84c9ad]/50 group-hover:text-[#84c9ad] transition-all duration-300">
                {step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {t(`howItWorks.step${step}.title`)}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed px-4">
                {t(`howItWorks.step${step}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
