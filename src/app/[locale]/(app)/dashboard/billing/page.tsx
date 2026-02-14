// src/app/[locale]/(app)/dashboard/billing/page.tsx

import { headers } from "next/headers";
import { type AliigoCurrency, getCurrencyFromHeaders } from "@/lib/currency";
import BillingPageClient from "@/app/[locale]/(app)/dashboard/billing/BillingPageClient";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const headerStore = await headers();
  const inferred = getCurrencyFromHeaders(headerStore);
  const currency = (inferred ?? (locale === "es" ? "EUR" : "USD")) as AliigoCurrency;

  return <BillingPageClient initialCurrency={currency} />;
}
