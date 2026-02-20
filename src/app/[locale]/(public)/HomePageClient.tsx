"use client";

import { useLocale } from "next-intl";
import { type AliigoCurrency } from "@/lib/currency";
import { formatPlanPrice, planPriceAmount } from "@/lib/pricing";
import { HomeHeroSection } from "@/components/home/Hero";
import { CredibilityStrip } from "@/components/home/CredibilityStrip";
import { FounderTrustCard } from "@/components/home/FounderTrustCard";
import { WorksWithStrip } from "@/components/home/WorksWithStrip";
import { HumanProofSection } from "@/components/home/HumanProofSection";
import { FeaturesGridSection } from "@/components/home/FeaturesGridSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PricingSection } from "@/components/home/PricingSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";

type HomePageClientProps = {
  initialCurrency: AliigoCurrency;
};

export default function HomePageClient({ initialCurrency }: HomePageClientProps) {
  const locale = useLocale();
  const currency = initialCurrency;

  const basicPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "basic"),
    currency,
    locale,
    forceLeadingEuroForSpanish: true,
  });
  const growthPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "growth"),
    currency,
    locale,
    forceLeadingEuroForSpanish: true,
  });
  const proPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "pro"),
    currency,
    locale,
    forceLeadingEuroForSpanish: true,
  });
  const customPrice = formatPlanPrice({
    amount: planPriceAmount(currency, "custom"),
    currency,
    locale,
    forceLeadingEuroForSpanish: true,
  });

  return (
    <div className="bg-zinc-950 overflow-hidden selection:bg-[#84c9ad]/30">
      <HomeHeroSection />
      <CredibilityStrip />
      <HumanProofSection />
      <PricingSection
        basicPrice={basicPrice}
        growthPrice={growthPrice}
        proPrice={proPrice}
        customPrice={customPrice}
      />
      <HowItWorksSection />
      <FeaturesGridSection />
      <FaqSection />
      <FounderTrustCard />
      <WorksWithStrip />
      <FinalCtaSection />
    </div>
  );
}
