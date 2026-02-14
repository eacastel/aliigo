// src/app/[locale]/(public)/page.tsx

import { headers } from "next/headers";
import { type AliigoCurrency, getCurrencyFromHeaders } from "@/lib/currency";
import HomePageClient from "@/app/[locale]/(public)/HomePageClient";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const headerStore = await headers();
  const inferred = getCurrencyFromHeaders(headerStore);
  const currency = (inferred ?? (locale === "es" ? "EUR" : "USD")) as AliigoCurrency;

  return <HomePageClient initialCurrency={currency} />;
}
