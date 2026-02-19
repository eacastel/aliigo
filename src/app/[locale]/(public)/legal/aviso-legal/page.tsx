import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildLegalMetadata } from "@/lib/legalMetadata";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LegalV3.legalNotice" });

  return buildLegalMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    enPath: "/en/legal/legal-notice",
    esPath: "/es/legal/aviso-legal",
  });
}

export default function LegalNoticePage() {
  const t = useTranslations("LegalV3.legalNotice");
  const sections = [1, 2, 3, 4, 5, 6];

  return (
    <div className="bg-zinc-950 min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-zinc-300 space-y-12">
        <div className="border-b border-zinc-800 pb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-zinc-500 text-sm">
            {t("lastUpdated", { date: new Date().toLocaleDateString() })}
          </p>
          <p className="mt-4 text-lg">{t("intro")}</p>
        </div>

        {sections.map((num) => (
          <section key={num}>
            <h2 className="text-xl font-semibold text-white mb-4">
              {t(`section${num}.title`)}
            </h2>
            <p className="text-sm text-zinc-400 whitespace-pre-line">
              {t(`section${num}.content`)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
