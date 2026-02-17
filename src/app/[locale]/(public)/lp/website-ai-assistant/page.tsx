import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import {
  getCurrencyFromHeaders,
  normalizeCurrency,
  type AliigoCurrency,
} from "@/lib/currency";
import { formatPlanPrice, planPriceAmount } from "@/lib/pricing";
import { LpHeroSection } from "@/components/home/LpHeroSection";
import { CredibilityStrip } from "@/components/home/CredibilityStrip";
import { PricingSection } from "@/components/home/PricingSection";
import { AssistantDemoSection } from "@/components/home/AssistantDemoSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FeaturesGridSection } from "@/components/home/FeaturesGridSection";
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
  if (["eu", "europe", "eea", "es", "spain"].includes(marketParam)) return "EUR";
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
  const marketParam = (Array.isArray(query.market) ? query.market[0] : query.market)
    ?.trim()
    .toLowerCase();
  const currency = resolveMarketCurrency({
    market: query.market,
    currency: query.currency,
    fallback: headerCurrency,
  });

  const shouldForceSpanishEuro = currency === "EUR" && (marketParam === "es" || locale === "es");
  const basicPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "basic"),
    currency,
    locale,
    forceLeadingEuroForSpanish: shouldForceSpanishEuro,
  });
  const growthPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "growth"),
    currency,
    locale,
    forceLeadingEuroForSpanish: shouldForceSpanishEuro,
  });
  const proPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "pro"),
    currency,
    locale,
    forceLeadingEuroForSpanish: shouldForceSpanishEuro,
  });
  const customPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "custom"),
    currency,
    locale,
    forceLeadingEuroForSpanish: shouldForceSpanishEuro,
  });

  return (
    <div className="bg-zinc-950 overflow-hidden selection:bg-[#84c9ad]/30">
      <LpHeroSection startingPrice={basicPrice} />
      <CredibilityStrip />
      <div id="pricing">
        <div className="max-md:[&>section]:py-16">
          <PricingSection
            basicPrice={basicPrice}
            growthPrice={growthPrice}
            proPrice={proPrice}
            customPrice={customPrice}
          />
        </div>
      </div>
      <div className="max-md:[&>section]:py-16">
        <AssistantDemoSection />
      </div>
      <div className="max-md:[&>section]:py-16">
        <HowItWorksSection />
      </div>
      <div className="max-md:[&>section]:py-16">
        <FeaturesGridSection />
      </div>
      <div className="max-md:[&>section]:py-16">
        <FaqSection />
      </div>
      <div className="max-md:pt-2 max-md:pb-4">
        <FounderTrustCard />
      </div>
      <FinalCtaSection />
      <HomeFloatingWidgetGate />
    </div>
  );
}
