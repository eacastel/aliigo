import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Section = {
  id: string;
  title: string;
  body?: string;
  bullets?: string[];
};

function renderInlineWithBold(text: string) {
  const parts = text.split(/(\*\*.+?\*\*)/g).filter(Boolean);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return <span key={idx}>{part}</span>;
  });
}

function renderBody(body: string) {
  const blocks = body.split("\n\n").map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, i) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const isList = lines.length > 0 && lines.every((l) => l.startsWith("- "));
    if (isList) {
      return (
        <ul key={i} className="mt-3 space-y-2 text-sm text-zinc-300 list-disc pl-5">
          {lines.map((l) => (
            <li key={l}>{renderInlineWithBold(l.replace(/^-\\s*/, ""))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="mt-3 text-sm text-zinc-300 leading-relaxed">
        {lines.map((line, idx) => (
          <span key={idx}>
            {renderInlineWithBold(line)}
            {idx < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  });
}

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
  const sections = (t.raw("sections") as Section[]) || [];
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
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("hero.headline")}
          </h1>
          <p className="text-lg text-zinc-400 mb-8">
            {t("hero.subheadline")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all"
            >
              {t("hero.ctaPrimary")}
            </Link>
            <Link
              href="/why-aliigo"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {sections.map((s) => (
          <div key={s.id} className="border-b border-white/5 pb-8 last:border-b-0 last:pb-0">
            <h2 className="text-2xl font-semibold mb-2">{s.title}</h2>
            {s.body ? renderBody(s.body) : null}
            {s.bullets ? (
              <ul className="mt-3 space-y-2 text-sm text-zinc-300 list-disc pl-5">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </section>

      <section className="border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-semibold mb-4">
            {t("finalCta.headline")}
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all"
            >
              {t("finalCta.ctaPrimary")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
