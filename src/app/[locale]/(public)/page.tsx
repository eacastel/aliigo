import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getCurrencyFromHeaders } from "@/lib/currency";
import { buildLocalePageMetadata } from "@/lib/localePageMetadata";
import HomePageClient from "./HomePageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return buildLocalePageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    enPath: "/en",
    esPath: "/es",
  });
}

export default async function HomePage() {
  const currency = getCurrencyFromHeaders(await headers());
  return <HomePageClient initialCurrency={currency} />;
}
