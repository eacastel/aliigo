"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function CtaBand() {
  const t = useTranslations("Landing");

  return (
    <section className="border-t border-b border-white/5 bg-zinc-950/70">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-lg font-semibold text-white text-center sm:text-left">
            {t("ctaBand.title")}
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all shadow-[0_0_20px_rgba(132,201,173,0.25)] w-full sm:w-auto"
          >
            {t("ctaBand.button")}
          </Link>
        </div>
      </div>
    </section>
  );
}
