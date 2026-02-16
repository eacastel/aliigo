import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { FitFilterSection } from "@/components/home/FitFilterSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.whyAliigo" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function WhyAliigoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.whyAliigo" });
  const tClarity = await getTranslations({ locale, namespace: "Landing.clarity" });
  const fitValue = new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency: locale === "es" ? "EUR" : "USD",
    maximumFractionDigits: 0,
  }).format(500);

  const siteUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/${locale}/why-aliigo`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("hero.headline"),
    description: t("metaDescription"),
    url: pageUrl,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "Aliigo",
      url: siteUrl,
    },
    about: {
      "@type": "Organization",
      name: "Aliigo",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
  };

  return (
    <main className="bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
                  {t("hero.headline")}
                </span>
              </h1>
              <p className="text-lg text-zinc-400 mb-8">{t("hero.subheadline")}</p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href={{ pathname: "/", hash: "assistant-demo" }}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>

              <p className="mt-5 text-sm text-zinc-400">{t("hero.microstrip")}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
              <h2 className="text-base font-semibold text-zinc-200 mb-4">{t("hero.visualTitle")}</h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-sm text-zinc-200">
                  {t("pillars.card1.title")}
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-sm text-zinc-200">
                  {t("pillars.card2.title")}
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-sm text-zinc-200">
                  {t("pillars.card3.title")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">{t("pillars.title")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5">
            <h3 className="font-semibold mb-2">{t("pillars.card1.title")}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{t("pillars.card1.body")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5">
            <h3 className="font-semibold mb-2">{t("pillars.card2.title")}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{t("pillars.card2.body")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5">
            <h3 className="font-semibold mb-2">{t("pillars.card3.title")}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{t("pillars.card3.body")}</p>
          </div>
        </div>
      </section>

      <FitFilterSection value={fitValue} />

      <section className="max-w-6xl mx-auto px-4 py-4">
        <h2 className="text-2xl font-semibold mb-6">{t("comparison.title")}</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/20">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="text-left p-4 text-zinc-300 font-semibold">{t("comparison.cols.feature")}</th>
                <th className="text-left p-4 text-zinc-300 font-semibold">{t("comparison.cols.aliigo")}</th>
                <th className="text-left p-4 text-zinc-300 font-semibold">{t("comparison.cols.generic")}</th>
                <th className="text-left p-4 text-zinc-300 font-semibold">{t("comparison.cols.liveChat")}</th>
              </tr>
            </thead>
            <tbody>
              {(["r1", "r2", "r3", "r4", "r5", "r6"] as const).map((r) => (
                <tr key={r} className="border-t border-white/10">
                  <td className="p-4 text-zinc-300">{t(`comparison.rows.${r}.feature`)}</td>
                  <td className="p-4 text-zinc-100">{t(`comparison.rows.${r}.aliigo`)}</td>
                  <td className="p-4 text-zinc-400">{t(`comparison.rows.${r}.generic`)}</td>
                  <td className="p-4 text-zinc-400">{t(`comparison.rows.${r}.liveChat`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">{t("weekOne.title")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {(["d0", "d1", "d3", "d7"] as const).map((day) => (
            <div key={day} className="rounded-2xl border border-white/10 bg-zinc-900/20 p-5">
              <p className="text-xs uppercase tracking-wider text-[#84c9ad] mb-2">{t(`weekOne.${day}.day`)}</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{t(`weekOne.${day}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5">
          <h2 className="text-xl font-semibold mb-4">{t("trustPack.title")}</h2>
          <div className="flex flex-wrap gap-3">
            {(["c1", "c2", "c3", "c4"] as const).map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-white/15 bg-zinc-950/60 px-3 py-1.5 text-xs text-zinc-300"
              >
                {t(`trustPack.${chip}`)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 text-center">
          <p className="text-zinc-300 mb-3">{t("crossLink.prompt")}</p>
          <Link
            href="/founder"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
          >
            {t("crossLink.cta")}
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
              {tClarity("title")}
            </span>
          </h2>
          <p className="text-zinc-400 mb-6">{tClarity("note")}</p>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {(["card1", "card2", "card3"] as const).map((card) => (
              <div key={card} className="rounded-xl border border-white/10 bg-zinc-950/50 p-4">
                <h3 className="text-sm font-semibold text-white mb-1">
                  {tClarity(`${card}.title`)}
                </h3>
                <p className="text-sm text-zinc-400">{tClarity(`${card}.benefit`)}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all"
            >
              {t("finalCta.ctaPrimary")}
            </Link>
            <Link
              href={{ pathname: "/", hash: "assistant-demo" }}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
            >
              {t("finalCta.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-semibold mb-3">{t("finalCta.headline")}</h3>
          <p className="text-zinc-400 mb-5">{t("finalCta.subheadline")}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all"
            >
              {t("finalCta.ctaPrimary")}
            </Link>
            <Link
              href={{ pathname: "/", hash: "assistant-demo" }}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
            >
              {t("finalCta.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
