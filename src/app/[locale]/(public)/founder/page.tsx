import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.founder" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function FounderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.founder" });
  const siteUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/${locale}/founder`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Emilio Castellanos Abis",
    jobTitle: locale === "es" ? "Fundador" : "Founder",
    worksFor: {
      "@type": "Organization",
      name: "Aliigo",
      url: siteUrl,
    },
    url: pageUrl,
  };

  return (
    <main className="bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden ring-1 ring-white/10 bg-zinc-900">
                  <Image
                    src="/founder2.png"
                    alt={t("hero.photoAlt")}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t("hero.name")}</p>
                  <p className="text-xs text-zinc-500">{t("hero.role")}</p>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
                  {t("hero.headline")}
                </span>
              </h1>
              <p className="text-lg text-zinc-400">{t("hero.subheadline")}</p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
                >
                  {t("hero.ctaSecondary")}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
              <h2 className="text-base font-semibold text-zinc-200 mb-4">{t("hero.commitmentTitle")}</h2>
              <ul className="space-y-3 text-sm text-zinc-300">
                {(["i1", "i2", "i3", "i4"] as const).map((i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[#84c9ad]">•</span>
                    <span>{t(`hero.commitment.${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">{t("whyBuilt.title")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(["card1", "card2", "card3"] as const).map((card) => (
            <div key={card} className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5">
              <h3 className="font-semibold mb-2">{t(`whyBuilt.${card}.title`)}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t(`whyBuilt.${card}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-4">
        <h2 className="text-2xl font-semibold mb-6">{t("earlyCustomers.title")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(["i1", "i2", "i3"] as const).map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-zinc-900/20 p-5">
              <h3 className="font-semibold mb-2">{t(`earlyCustomers.${i}.title`)}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t(`earlyCustomers.${i}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">{t("timeline.title")}</h2>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/20 p-5">
          <ol className="space-y-3 text-sm text-zinc-300 list-decimal pl-5">
            {(["t1", "t2", "t3", "t4", "t5"] as const).map((item) => (
              <li key={item}>{t(`timeline.${item}`)}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 text-center">
          <p className="text-zinc-300 mb-3">{t("crossLink.prompt")}</p>
          <Link
            href="/why-aliigo"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
          >
            {t("crossLink.cta")}
          </Link>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-semibold mb-4">{t("finalCta.headline")}</h3>
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all"
            >
              {t("finalCta.ctaPrimary")}
            </Link>
            <Link
              href="/why-aliigo"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
            >
              {t("finalCta.ctaSecondary")}
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
            <a href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t("finalCta.linkPrivacy")}</a>
            <a href={`/${locale}/dpa`} className="hover:text-white transition-colors">{t("finalCta.linkDpa")}</a>
            <a href={`/${locale}/subprocessors`} className="hover:text-white transition-colors">{t("finalCta.linkSubprocessors")}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
