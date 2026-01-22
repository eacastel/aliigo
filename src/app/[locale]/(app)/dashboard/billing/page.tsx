// src/app/[locale]/(app)/dashboard/billing/page.tsx

"use client";

import { useTranslations } from "next-intl";

export default function BillingPage() {
  const t = useTranslations("Billing");

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      <p className="text-zinc-300">{t("pending")}</p>
    </main>
  );
}
