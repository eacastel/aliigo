import type { AliigoCurrency } from "@/lib/currency";

export type PublicPlan = "basic" | "growth" | "pro" | "custom";

const PRICE_BY_CURRENCY: Record<AliigoCurrency, Record<PublicPlan, number>> = {
  USD: {
    basic: 49,
    growth: 99,
    pro: 149,
    custom: 349,
  },
  EUR: {
    basic: 39,
    growth: 89,
    pro: 129,
    custom: 299,
  },
};

export function planPriceAmount(currency: AliigoCurrency, plan: PublicPlan): number {
  return PRICE_BY_CURRENCY[currency][plan];
}

export function formatPlanPrice(opts: {
  amount: number;
  currency: AliigoCurrency;
  locale: string;
  forceLeadingEuroForSpanish?: boolean;
}): string {
  const displayLocale = opts.currency === "USD" ? "en-US" : opts.locale;
  const formatted = new Intl.NumberFormat(displayLocale, {
    style: "currency",
    currency: opts.currency,
    maximumFractionDigits: 0,
  }).format(opts.amount);

  if (opts.forceLeadingEuroForSpanish && opts.currency === "EUR" && opts.locale.startsWith("es")) {
    const numberPart = formatted.replace("€", "").replace(/\s/g, "").trim();
    return `€${numberPart}`;
  }

  return formatted;
}
