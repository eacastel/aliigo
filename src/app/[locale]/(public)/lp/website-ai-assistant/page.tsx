import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import {
  getCurrencyFromHeaders,
  normalizeCurrency,
  type AliigoCurrency,
} from "@/lib/currency";
import { LpHeroSection } from "@/components/home/LpHeroSection";
import { CredibilityStrip } from "@/components/home/CredibilityStrip";
import { FitFilterSection } from "@/components/home/FitFilterSection";
import { BusinessImpactSection } from "@/components/home/BusinessImpactSection";
import { PricingSection } from "@/components/home/PricingSection";
import { AssistantDemoSection } from "@/components/home/AssistantDemoSection";
import { WorksWithStrip } from "@/components/home/WorksWithStrip";
import { FaqSection } from "@/components/home/FaqSection";
import { FounderTrustCard } from "@/components/home/FounderTrustCard";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { HomeFloatingWidgetGate } from "@/components/home/FloatingWidgetGate";

function resolveMarketCurrency(params: {
  market?: string | string[];
  currency?: string | string[];
  fallback: AliigoCurrency;
}): AliigoCurrency {
  const currencyParam = Array.isArray(params.currency)
    ? params.currency[0]
    : params.currency;
  const normalizedCurrency = normalizeCurrency(currencyParam);
  if (normalizedCurrency) return normalizedCurrency;

  const marketParam = (Array.isArray(params.market) ? params.market[0] : params.market)
    ?.trim()
    .toLowerCase();
  if (!marketParam) return params.fallback;

  if (["us", "usa", "na"].includes(marketParam)) return "USD";
  if (["eu", "europe", "eea"].includes(marketParam)) return "EUR";
  return params.fallback;
}

export default async function PaidLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string | string[]; currency?: string | string[] }>;
}) {
  const locale = await getLocale();
  const headerCurrency = getCurrencyFromHeaders(await headers());
  const query = await searchParams;
  const currency = resolveMarketCurrency({
    market: query.market,
    currency: query.currency,
    fallback: headerCurrency,
  });

  const displayLocale = currency === "USD" ? "en-US" : locale;
  const priceFmt = new Intl.NumberFormat(displayLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const starterPrice = priceFmt.format(99);
  const growthPrice = priceFmt.format(149);
  const proPrice = priceFmt.format(349);
  const fitValue = priceFmt.format(500);

  return (
    <div className="bg-zinc-950 overflow-hidden selection:bg-[#84c9ad]/30">
      <LpHeroSection startingPrice={starterPrice} />
      <CredibilityStrip />
      <FitFilterSection value={fitValue} />
      <BusinessImpactSection />
      <div id="pricing">
        <PricingSection
          starterPrice={starterPrice}
          growthPrice={growthPrice}
          proPrice={proPrice}
        />
      </div>
      <AssistantDemoSection />
      <WorksWithStrip />
      <FaqSection />
      <FounderTrustCard />
      <FinalCtaSection />
      <HomeFloatingWidgetGate />
    </div>
  );
}

