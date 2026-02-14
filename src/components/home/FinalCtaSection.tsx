"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function FinalCtaSection() {
  const t = useTranslations("Landing");

  return (
    <section className="py-20 text-center border-t border-white/5 bg-gradient-to-b from-zinc-950 to-zinc-900">
      <h2 className="text-3xl font-bold text-white mb-6">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
          {t("finalCta.title")}
        </span>
      </h2>
      <Link
        href="/signup"
        className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-8 py-4 text-base font-bold hover:bg-[#73bba0] transition-all shadow-[0_0_20px_rgba(132,201,173,0.25)]"
      >
        {t("finalCta.button")}
      </Link>
    </section>
  );
}
