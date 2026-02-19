import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildLegalMetadata } from "@/lib/legalMetadata";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "LegalV3.subprocessors" });

  return buildLegalMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    enPath: "/en/legal/subprocessors",
    esPath: "/es/legal/subprocessors",
  });
}

export default function SubprocessorsPage() {
  const t = useTranslations("LegalV3.subprocessors");
  const items = t.raw("items") as Record<string, string>;

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

        <section>
          <ul className="space-y-3 text-sm text-zinc-400">
            {Object.entries(items).map(([key, value]) => (
              <li key={key} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                {value}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
