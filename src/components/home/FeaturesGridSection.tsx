"use client";

import { useTranslations } from "next-intl";
import { Compass, Layers, MousePointerClick, Target } from "lucide-react";

export function FeaturesGridSection() {
  const t = useTranslations("Landing");

  return (
    <section className="py-24 bg-zinc-950 relative border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
              {t("featuresGrid.title")}
            </span>
          </h2>
          <p className="text-zinc-400 text-lg">
            {t("featuresGrid.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {/* CARD 1: KNOWLEDGE BASE (Span 2) */}
          <div className="md:col-span-2 group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 relative overflow-hidden hover:bg-zinc-900/60 transition-all duration-500">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Layers className="text-purple-400" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t("featuresGrid.card1.title")}
                </h3>
                <p className="text-zinc-400 max-w-md">
                  {t("featuresGrid.card1.desc")}
                </p>
              </div>

              {/* VISUAL: The "Syncing" UI */}
              <div className="relative w-full bg-zinc-950 border border-white/10 rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-zinc-500">
                    {t("featuresGrid.card1.syncLabel")}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                        {t("featuresGrid.card1.tagUrl")}
                      </span>
                      yourwebsite.com/pricing
                    </div>
                    <span className="text-emerald-500 text-xs font-bold">
                      {t("featuresGrid.card1.imported")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                        {t("featuresGrid.card1.tagPdf")}
                      </span>
                      Q4_Service_Menu.pdf
                    </div>
                    <span className="text-emerald-500 text-xs font-bold">
                      {t("featuresGrid.card1.imported")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm opacity-50">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                        {t("featuresGrid.card1.tagDoc")}
                      </span>
                      Policy_Knowledge.docx
                    </div>
                    <span className="text-zinc-500 text-xs">
                      {t("featuresGrid.card1.scanning")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-500 pointer-events-none" />
          </div>

          {/* CARD 2: LEAD CAPTURE (Span 1) */}
          <div className="group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 relative overflow-hidden hover:bg-zinc-900/60 transition-all duration-500">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-transparent to-zinc-950/80 pointer-events-none z-0" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#84c9ad]/10 flex items-center justify-center mb-4 border border-[#84c9ad]/20 group-hover:scale-110 transition-transform duration-300">
                <Target className="text-[#84c9ad]" size={24} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {t("featuresGrid.card2.title")}
              </h3>

              <p className="text-zinc-400 text-sm mb-6">
                {t("featuresGrid.card2.desc")}
              </p>

              {/* VISUAL: The Notification Card */}
              <div className="bg-zinc-800/50 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg transform group-hover:-translate-y-1 transition-transform duration-500">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                    JS
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-400 mb-0.5">
                      {t("featuresGrid.card2.notifTitle")}
                    </div>
                    <div className="text-sm font-semibold text-white truncate">
                      John Smith
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      john@company.com
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#84c9ad]" />
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#84c9ad]/10 blur-[60px] rounded-full group-hover:bg-[#84c9ad]/20 transition-all duration-500 pointer-events-none" />
          </div>

          {/* CARD 3: SMART ACTIONS (Span 1) */}
          <div className="group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 relative overflow-hidden hover:bg-zinc-900/60 transition-all duration-500">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 border border-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                <MousePointerClick className="text-orange-400" size={24} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {t("featuresGrid.card3.title")}
              </h3>

              <p className="text-zinc-400 text-sm mb-6">
                {t("featuresGrid.card3.desc")}
              </p>

              {/* VISUAL: The Calendar Button UI */}
              <div className="mt-auto">
                <div className="bg-zinc-950 border border-white/10 rounded-lg p-3 max-w-[80%] mb-3">
                  <div className="h-2 w-16 bg-zinc-800 rounded mb-2" />
                  <div className="h-2 w-24 bg-zinc-800 rounded" />
                </div>

                <div
                  className="w-2/3 rounded-lg py-2.5 px-4 flex items-center justify-center gap-2
            bg-zinc-800/50 backdrop-blur-md text-zinc-200 ring-1 ring-inset ring-zinc-700/60
             select-none pointer-events-none"
                >
                  <span className="font-bold text-xs">
                    {t("featuresGrid.card3.cta")}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-500/10 blur-[60px] rounded-full group-hover:bg-orange-500/20 transition-all duration-500 pointer-events-none" />
          </div>

          {/* CARD 4: ANALYTICS/SUMMARY (Span 2) */}
          <div className="md:col-span-2 group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 relative overflow-hidden hover:bg-zinc-900/60 transition-all duration-500 flex flex-col md:flex-row items-center gap-8">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-500 pointer-events-none" />

            <div className="flex-1 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <Compass className="text-blue-400" size={24} />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {t("featuresGrid.card4.title")}
              </h3>

              <p className="text-zinc-400">{t("featuresGrid.card4.desc")}</p>
            </div>

            {/* VISUAL: Mini Chart */}
            <div className="w-full md:w-1/2 relative bg-zinc-950 border border-white/10 rounded-xl p-5 shadow-2xl">
              <div className="flex justify-between items-end h-24 gap-2">
                {[30, 45, 35, 60, 50, 75, 90].map((h, i) => (
                  <div
                    key={i}
                    className="w-full bg-zinc-800 rounded-t-sm relative group-hover:bg-zinc-700 transition-colors overflow-hidden"
                  >
                    <div
                      className="absolute bottom-0 w-full bg-blue-500/80 transition-all duration-1000 ease-out"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-zinc-500 font-mono uppercase">
                <span>{t("featuresGrid.card4.chartMon")}</span>
                <span>{t("featuresGrid.card4.chartSun")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
