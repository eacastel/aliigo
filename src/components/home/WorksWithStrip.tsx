"use client";

import { useTranslations } from "next-intl";
import { WorksWithRow } from "@/components/WorksWithRow";

export function WorksWithStrip() {
  const t = useTranslations("Landing");

  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-xl md:text-2xl font-semibold text-white">
            {t("integrations.title")}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {t("integrations.note")}
          </p>
        </div>
        <WorksWithRow />
      </div>
    </section>
  );
}
