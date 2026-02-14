"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getClientCurrency, type AliigoCurrency } from "@/lib/currency";

export function FitFilterSection() {
  const t = useTranslations("Landing.fitFilter");
  const locale = useLocale();
  const currency = (getClientCurrency() ?? "EUR") as AliigoCurrency;
  const displayLocale = currency === "USD" ? "en-US" : locale;
  const value = useMemo(
    () =>
      new Intl.NumberFormat(displayLocale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(500),
    [displayLocale, currency]
  );

  return (
    <section className="border-b border-white/5 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 md:text-center">
            <h3 className="text-lg font-semibold text-white mb-4 md:text-center">
              {t("ideal.title")}
            </h3>
            <ul className="space-y-3 text-zinc-200 md:mx-auto md:max-w-sm">
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="md:text-center"
                >
                  <div className="flex justify-center">
                    <span className="inline-flex items-start md:items-center gap-3 text-center">
                      <CheckCircle2 className="mt-1 h-5 w-5 text-[#84c9ad] md:mt-0 shrink-0" />
                      <span className="text-center max-w-[18rem]">
                        {t(`ideal.item${i}`, { value })}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 md:text-center">
            <h3 className="text-lg font-semibold text-white mb-4 md:text-center">
              {t("notIdeal.title")}
            </h3>
            <ul className="space-y-3 text-zinc-300 md:mx-auto md:max-w-sm">
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="md:text-center"
                >
                  <div className="flex justify-center">
                    <span className="inline-flex items-start md:items-center gap-3 text-center">
                      <XCircle className="mt-1 h-5 w-5 text-red-400 md:mt-0 shrink-0" />
                      <span className="text-center max-w-[18rem]">
                        {t(`notIdeal.item${i}`)}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
