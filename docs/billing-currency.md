# Billing & Currency Strategy

This document describes how Aliigo handles currency for pricing display and Stripe billing.

## Goal
- **EUR** for Europe
- **USD** for the US and rest of world
- Same numeric prices; only denomination changes per region

## How currency is selected
We set a cookie named `aliigo_currency` via middleware:
- EU/EEA → `EUR`
- US/other → `USD`
- If country is unavailable (e.g., localhost), we fall back to **path locale**:
  - `es` → `EUR`
  - `en` → `USD`

**Important:** Locale is **not** stored in cookies anymore. Locale is determined by URL path (e.g., `/es`, `/en`) and browser language when no locale is present in the path. We removed `NEXT_LOCALE` usage to avoid stale locale issues.

This cookie is used for:
- Pricing display on public pages
- Billing UI in the dashboard
- Stripe subscription creation

## Stripe pricing model
Use **one product per plan**, and **multiple prices per currency**.

Plans:
- Starter
- Growth

Required env vars:
```
STRIPE_PRICE_STARTER_EUR
STRIPE_PRICE_GROWTH_EUR
STRIPE_PRICE_STARTER_USD
STRIPE_PRICE_GROWTH_USD
```

If using prod keys, mirror with your prod environment values.

## Where it’s applied in code
- `src/middleware.ts` sets `aliigo_currency`
- `src/lib/currency.ts` helpers for parsing/formatting
- `src/lib/stripe.ts` maps currency → Stripe price IDs
- `src/app/api/stripe/subscribe/route.ts` creates subscription using currency
- Pricing UI:
  - `src/app/[locale]/(public)/page.tsx`
  - `src/app/[locale]/(public)/pricing/page.tsx`
  - `src/app/[locale]/(app)/dashboard/billing/page.tsx`
  - `src/components/billing/PlanSelector.tsx`

## Notes
- Language is **not** tied to Stripe product/prices.
- Pricing injected into the AI prompt is **aliigo.com only**.
