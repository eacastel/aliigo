"use client";

import { useLocale } from "next-intl";
import { type AliigoCurrency } from "@/lib/currency";
import { HomeHeroSection } from "@/components/home/Hero";
import { ClaritySection } from "@/components/home/ClaritySection";
import { FitFilterSection } from "@/components/home/FitFilterSection";
import { AssistantDemoSection } from "@/components/home/AssistantDemoSection";
import { BusinessImpactSection } from "@/components/home/BusinessImpactSection";
import { CredibilityStrip } from "@/components/home/CredibilityStrip";
import { FounderTrustCard } from "@/components/home/FounderTrustCard";
import { WorksWithStrip } from "@/components/home/WorksWithStrip";
import { FeaturesGridSection } from "@/components/home/FeaturesGridSection";
import { CtaBand } from "@/components/home/CtaBand";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PricingSection } from "@/components/home/PricingSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { HomeFloatingWidgetGate } from "@/components/home/FloatingWidgetGate";

type HomePageClientProps = {
  initialCurrency: AliigoCurrency;
};

export default function HomePageClient({ initialCurrency }: HomePageClientProps) {
  const locale = useLocale();
  const currency = initialCurrency;

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
      <HomeHeroSection />
      <ClaritySection />
      <FitFilterSection value={fitValue} />
      <AssistantDemoSection />
      <BusinessImpactSection />
      <CredibilityStrip />
      <FounderTrustCard />
      <WorksWithStrip />
      <FeaturesGridSection />
      <CtaBand />
      <HowItWorksSection />
      <PricingSection
        starterPrice={starterPrice}
        growthPrice={growthPrice}
        proPrice={proPrice}
      />
      <FaqSection />
      <FinalCtaSection />
      <HomeFloatingWidgetGate />
    </div>
  );
}
