# Homepage Components (Public Landing)

This document lists the homepage sections that were moved into `src/components/home/` and the render order.

## Render order
1. `HomeHeroSection` — `src/components/home/Hero.tsx`
2. `ClaritySection` — `src/components/home/ClaritySection.tsx`
3. `FitFilterSection` — `src/components/home/FitFilterSection.tsx`
4. `AssistantDemoSection` — `src/components/home/AssistantDemoSection.tsx`
5. `BusinessImpactSection` — `src/components/home/BusinessImpactSection.tsx`
6. `CredibilityStrip` — `src/components/home/CredibilityStrip.tsx`
7. `FounderTrustCard` — `src/components/home/FounderTrustCard.tsx`
8. `WorksWithStrip` — `src/components/home/WorksWithStrip.tsx`
9. `FeaturesGridSection` — `src/components/home/FeaturesGridSection.tsx`
10. `CtaBand` — `src/components/home/CtaBand.tsx`
11. `HowItWorksSection` — `src/components/home/HowItWorksSection.tsx`
12. `PricingSection` — `src/components/home/PricingSection.tsx`
13. `FaqSection` — `src/components/home/FaqSection.tsx`
14. `FinalCtaSection` — `src/components/home/FinalCtaSection.tsx`
15. `HomeFloatingWidgetGate` — `src/components/home/FloatingWidgetGate.tsx`

## Entry points
- `src/app/[locale]/(public)/page.tsx` — server wrapper
- `src/app/[locale]/(public)/HomePageClient.tsx` — assembles the sections above

## Notes
- Components were moved without markup changes.
- Currency formatting is passed into `HomePageClient` and then into `FitFilterSection` and `PricingSection`.
