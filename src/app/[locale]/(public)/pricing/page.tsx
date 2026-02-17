import { Link } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";
import { Check, CheckCircle2, Sparkles, Building2, Store, X, Zap } from "lucide-react";
import { ProContactForm } from "@/components/ProContactForm";
import { headers } from "next/headers";
import { getCurrencyFromHeaders, type AliigoCurrency } from "@/lib/currency";
import { formatPlanPrice, planPriceAmount } from "@/lib/pricing";

export default async function PricingPage() {
  const t = await getTranslations("Landing");
  const p = await getTranslations("PricingPage");
  const locale = await getLocale();
  const currency = getCurrencyFromHeaders(await headers()) as AliigoCurrency;
  const basicPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "basic"),
    currency,
    locale,
    forceLeadingEuroForSpanish: true,
  });
  const growthPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "growth"),
    currency,
    locale,
    forceLeadingEuroForSpanish: true,
  });
  const proPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "pro"),
    currency,
    locale,
    forceLeadingEuroForSpanish: true,
  });
  const customPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "custom"),
    currency,
    locale,
    forceLeadingEuroForSpanish: true,
  });
  const isEs = locale.startsWith("es");
  const matrixRows = [
    {
      feature: isEs ? "Conversaciones mensuales" : "Monthly conversations",
      basic: "50",
      growth: "500",
      pro: "2,000",
      custom: "10k+",
      type: "text",
    },
    {
      feature: isEs ? "Dominios" : "Domains",
      basic: "1",
      growth: "1",
      pro: "3",
      custom: isEs ? "Ilimitado" : "Unlimited",
      type: "text",
    },
    {
      feature: isEs ? "Entrenamiento con fuente web" : "Website source training",
      basic: true,
      growth: true,
      pro: true,
      custom: true,
      type: "bool",
    },
    {
      feature: isEs ? "Captura de leads (nombre + email)" : "Lead capture (name + email)",
      basic: true,
      growth: true,
      pro: true,
      custom: true,
      type: "bool",
    },
    {
      feature: isEs ? "Soporte por chat" : "Chat support",
      basic: false,
      growth: true,
      pro: true,
      custom: true,
      type: "bool",
    },
    {
      feature: isEs ? "Dominio ilimitado" : "Unlimited domains",
      basic: false,
      growth: false,
      pro: false,
      custom: true,
      type: "bool",
    },
    {
      feature: isEs ? "Soporte dedicado" : "Dedicated support",
      basic: false,
      growth: false,
      pro: false,
      custom: true,
      type: "bool",
    },
  ];

  return (
    <div className="bg-zinc-950 text-white">
      <section className="border-b border-white/5 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/40 py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#84c9ad]/30 bg-[#84c9ad]/10 px-4 py-2 text-sm font-semibold text-[#84c9ad]">
            <Sparkles size={16} className="fill-[#84c9ad]" />
            {p("badge")}
          </div>
          <h1 className="text-4xl font-bold md:text-5xl">{p("title")}</h1>
          <p className="mt-4 text-base text-zinc-400 md:text-lg">
            {p("subtitle")}
          </p>
          <p className="mt-6 max-w-2xl text-sm text-zinc-500">
            {p("description")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              {p("ctaPrimary")}
            </Link>
            <Link
              href={{ pathname: "/pricing", hash: "pro-contact" }}
              className="rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30"
            >
              {p("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-zinc-800 p-2 text-white">
                  <Store size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t("pricing.starter.name")}
                </h3>
              </div>

              <p className="mb-6 text-sm text-zinc-400">
                {t("pricing.starter.subtitle")}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{basicPrice}</span>
                <span className="text-zinc-500"> {t("pricing.period")}</span>
              </div>

              <Link
                href={{ pathname: "/signup", query: { plan: "basic" } }}
                className="block w-full rounded-lg border border-white/5 bg-zinc-800 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                {t("pricing.starter.cta")}
              </Link>

              <div className="mt-8 flex-1 border-t border-white/5 pt-8">
                <ul className="space-y-4 text-sm text-zinc-400">
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.starter.features.f1")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.starter.features.f2")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.starter.features.f3")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.starter.features.f4")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.starter.features.f5")}
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative z-10 flex flex-col rounded-2xl border-2 border-[#84c9ad] bg-zinc-900 p-8 shadow-2xl shadow-[#84c9ad]/10 lg:scale-105">
              <div className="absolute right-0 top-0 w-auto translate-x-4 -translate-y-1/2">
                <div className="rounded-full bg-[#84c9ad] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg">
                  {t("pricing.growth.tag")}
                </div>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-[#84c9ad]/20 p-2 text-[#84c9ad]">
                  <Zap size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t("pricing.growth.name")}
                </h3>
              </div>

              <p className="mb-6 text-sm text-zinc-300">
                {t("pricing.growth.subtitle")}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{growthPrice}</span>
                <span className="text-zinc-500"> {t("pricing.period")}</span>
              </div>

              <Link
                href={{ pathname: "/signup", query: { plan: "growth" } }}
                className="block w-full rounded-lg bg-[#84c9ad] py-3 text-center text-sm font-bold text-zinc-900 shadow-lg shadow-[#84c9ad]/20 transition hover:bg-[#73bba0]"
              >
                {t("pricing.growth.cta")}
              </Link>

              <div className="mt-8 flex-1 border-t border-white/10 pt-8">
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#84c9ad]">
                  {t("pricing.growth.plusLabel")}
                </div>

                <ul className="space-y-4 text-sm text-zinc-200">
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#84c9ad]" />
                    {t("pricing.growth.features.f1")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#84c9ad]" />
                    {t("pricing.growth.features.f2")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#84c9ad]" />
                    {t("pricing.growth.features.f3")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#84c9ad]" />
                    {t("pricing.growth.features.f4")}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-zinc-800 p-2 text-white">
                  <Building2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t("pricing.pro.name")}
                </h3>
              </div>

              <p className="mb-6 text-sm text-zinc-400">
                {t("pricing.pro.subtitle")}
              </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{proPrice}</span>
                  <span className="text-zinc-500"> {t("pricing.period")}</span>
                </div>

              <Link
                href={{ pathname: "/signup", query: { plan: "pro" } }}
                className="block w-full rounded-lg border border-white/5 bg-zinc-800 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                {t("pricing.pro.cta")}
              </Link>

              <div className="mt-8 flex-1 border-t border-white/5 pt-8">
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("pricing.pro.plusLabel")}
                </div>

                <ul className="space-y-4 text-sm text-zinc-400">
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.pro.features.f1")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.pro.features.f2")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.pro.features.f3")}
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-600" />
                    {t("pricing.pro.features.f4")}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-8 md:col-span-3">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-zinc-800 p-2 text-white">
                  <Building2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t("pricing.custom.name")}
                </h3>
              </div>

              <p className="mb-4 text-sm text-zinc-400">
                {t("pricing.custom.subtitle")}
              </p>

              <div className="mb-5">
                <div className="flex items-baseline">
                  <span className="mr-1 text-2xl font-semibold text-zinc-400">
                    {t("pricing.from")}
                  </span>
                  <span className="text-4xl font-bold text-white">{customPrice}</span>
                </div>
              </div>

              <Link
                href={{ pathname: "/pricing", hash: "pro-contact" }}
                className="block w-full rounded-lg border border-white/5 bg-zinc-800 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-700 md:w-auto md:px-6"
              >
                {t("pricing.custom.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="pro-contact" className="border-t border-white/5 bg-zinc-900/30 py-20">
        <div className="mx-auto mb-12 max-w-6xl px-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
            <h2 className="text-2xl font-bold text-white">
              {isEs ? "Comparativa de planes" : "Plan comparison"}
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-200">
                    <th className="px-3 py-2 font-semibold">{isEs ? "Función" : "Feature"}</th>
                    <th className="px-3 py-2 font-semibold text-emerald-300">Basic</th>
                    <th className="px-3 py-2 font-semibold text-emerald-300">Growth</th>
                    <th className="px-3 py-2 font-semibold text-emerald-300">Pro</th>
                    <th className="px-3 py-2 font-semibold text-emerald-300">Custom</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row) => (
                    <tr key={row.feature} className="border-b border-white/5 text-zinc-400">
                      <td className="px-3 py-2 text-zinc-200">{row.feature}</td>
                      {[row.basic, row.growth, row.pro, row.custom].map((value, idx) => (
                        <td key={`${row.feature}-${idx}`} className="px-3 py-2">
                          {row.type === "bool" ? (
                            value ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                                <Check size={14} /> {isEs ? "Incluido" : "Included"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-600/50 bg-zinc-800/50 px-2 py-1 text-xs text-zinc-400">
                                <X size={14} /> {isEs ? "No incluido" : "Not included"}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex rounded-full border border-white/10 bg-zinc-800/50 px-2 py-1 text-xs text-zinc-200">
                              {value}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">{p("contactTitle")}</h2>
            <p className="mt-3 text-sm text-zinc-400">{p("contactSubtitle")}</p>
            <p className="mt-2 text-xs text-zinc-500">{p("contactNote")}</p>
          </div>
          <ProContactForm />
        </div>
      </section>
    </div>
  );
}
