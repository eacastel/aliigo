"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function FounderTrustCard() {
  const t = useTranslations("Landing");

  return (
    <section className="bg-zinc-950/60">
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 md:p-6">
          <div className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-zinc-800 ring-1 ring-white/10 overflow-hidden">
                <Image
                  src="/founder.png"
                  alt={t("founder.photoAlt")}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {t("founder.name")}
                </div>
                <div className="text-xs text-zinc-500">
                  {t("founder.role")}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">
                {t("founder.headline")}
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t("founder.body")}
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t("founder.trust")}
              </p>
              <div>
                <Link
                  href="/why-aliigo"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950/40 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-900/70 transition-colors"
                >
                  {t("founder.cta")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
