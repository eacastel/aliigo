import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, Sparkles, Building2, Store, Zap } from "lucide-react";
import { ProContactForm } from "@/components/ProContactForm";
import { cookies } from "next/headers";
import { getCurrencyFromCookies, type AliigoCurrency } from "@/lib/currency";

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: { currency?: string | string[] };
}) {
  const t = useTranslations("Landing");
  const p = useTranslations("PricingPage");
  const locale = useLocale();
  const cookieStore = await cookies();
  const paramCurrency = Array.isArray(searchParams?.currency)
    ? searchParams?.currency[0]
    : searchParams?.currency;
  const currency =
    (paramCurrency?.toUpperCase() === "USD" || paramCurrency?.toUpperCase() === "EUR"
      ? (paramCurrency.toUpperCase() as AliigoCurrency)
      : getCurrencyFromCookies(cookieStore)) ?? "EUR";
  const priceFmt = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  const starterPrice = priceFmt.format(99);
  const growthPrice = priceFmt.format(149);
  const proPrice = priceFmt.format(349);

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
              href="#pro-contact"
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
                <span className="text-4xl font-bold text-white">{starterPrice}</span>
                <span className="text-zinc-500"> {t("pricing.period")}</span>
              </div>

              <Link
                href="/signup?plan=starter"
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
                href="/signup?plan=growth"
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

              <div className="mb-6 flex items-baseline">
                <span className="mr-1 text-2xl font-semibold text-zinc-400">
                  {t("pricing.from")}
                </span>
                <span className="text-4xl font-bold text-white">{proPrice}</span>
              </div>

              <Link
                href="#pro-contact"
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
          </div>
        </div>
      </section>

      <section id="pro-contact" className="border-t border-white/5 bg-zinc-900/30 py-20">
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
