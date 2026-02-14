"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { HomepageAssistantDemo } from "@/components/HomepageAssistantDemo";
import { CheckCircle2, Layers, MailMinus } from "lucide-react";

export function AssistantDemoSection() {
  const t = useTranslations("Landing");

  return (
    <section
      id="assistant-demo"
      className="relative py-24 overflow-hidden bg-[#F0F4F8]"
    >
      {/* Background Mesh Gradients */}
      <div className="absolute top-0 inset-x-0 h-full w-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-200 rounded-full blur-[120px] opacity-40 mix-blend-multiply animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#84c9ad] rounded-full blur-[120px] opacity-30 mix-blend-multiply" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT: COPY */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-900 text-xs font-bold mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {t("demo.badge")}
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 leading-[1.1] mb-6 tracking-tight">
              {t("demo.headlineLine1")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                {t("demo.headlineEmphasis")}
              </span>
            </h2>

            <p className="text-lg text-zinc-600 leading-relaxed mb-8 font-medium">
              {t("demo.subtitle")}
            </p>

            {/* Call out specific features visible in the demo */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100 text-emerald-600">
                  <Layers size={18} />
                </div>
                <span className="text-zinc-700 font-medium">
                  {t("demo.feature1")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-zinc-700 font-medium">
                  {t("demo.feature2")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-zinc-100 text-emerald-600">
                  <MailMinus size={18} />
                </div>
                <span className="text-zinc-700 font-medium">
                  {t("demo.feature3")}
                </span>
              </div>
            </div>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 text-white px-8 py-4 text-base font-bold hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {t("demo.cta")}
            </Link>
          </div>

          {/* RIGHT: THE STAGE */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="relative rounded-[3rem] bg-zinc-900 border-[10px] border-zinc-900 shadow-[0_50px_100px_-20px_rgba(50,50,93,0.25)] overflow-hidden ring-1 ring-black/5 z-20 transform transition-transform hover:scale-[1.01] duration-500">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-zinc-900 rounded-b-xl z-30" />

              <div className="bg-white h-[650px] w-full flex flex-col relative pt-8">
                {/* Status Bar Fake */}
                <div className="px-6 flex justify-between items-center text-[10px] font-bold text-zinc-400 mb-2">
                  <span>{t("demo.phone.time")}</span>
                  <div className="flex gap-1">
                    <span>{t("demo.phone.statusConnection")}</span>
                    <span>{t("demo.phone.statusWifi")}</span>
                    <span>{t("demo.phone.statusBattery")}</span>
                  </div>
                </div>

                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#84c9ad] to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      AI
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900">
                        {t("demo.phone.agentName")}
                      </div>
                      <div className="text-xs text-emerald-500 font-medium">
                        {t("demo.phone.agentSub")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Widget Area */}
                <div className="flex-1 bg-zinc-700 relative overflow-hidden">
                  <HomepageAssistantDemo
                  />
                </div>
              </div>
            </div>

            {/* Decorative elements behind the phone */}
            <div className="absolute top-20 -right-12 w-24 h-24 bg-[#84c9ad] rounded-2xl rotate-12 blur-sm opacity-20 z-0 animate-pulse" />
            <div className="absolute bottom-20 -left-12 w-32 h-32 bg-purple-400 rounded-full blur-xl opacity-20 z-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
