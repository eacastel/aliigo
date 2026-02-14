# Billing & Currency Strategy

This document describes how Aliigo handles currency for pricing display and Stripe billing.

## Goal
- **EUR** for Europe
- **USD** for the US and rest of world
- Same numeric prices; only denomination changes per region

## How currency is selected
Currency is derived **only** from the request country header:
- EU/EEA → `EUR`
- US/other → `USD`

We read from:
- `x-vercel-ip-country` (Vercel)
- `cf-ipcountry` (Cloudflare)

If the header is unavailable (e.g., localhost), we default to **USD**.

**Important:** Currency is **not** stored in cookies anymore. Locale is still determined by URL path (e.g., `/es`, `/en`) and browser language when no locale is present in the path.

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
- `src/proxy.ts` handles locale routing and sets `aliigo_country_debug`
- `src/lib/currency.ts` helpers (country → currency)
- `src/lib/stripe.ts` maps currency → Stripe price IDs
- `src/app/api/stripe/subscribe/route.ts` creates subscription using currency
- Pricing UI:
  - `src/app/[locale]/(public)/page.tsx` → `HomePageClient` (server passes `initialCurrency`)
  - `src/app/[locale]/(public)/pricing/page.tsx`
  - `src/app/[locale]/(app)/dashboard/billing/page.tsx` → `BillingPageClient`
  - `src/components/billing/PlanSelector.tsx`

## Notes
- Language is **not** tied to Stripe product/prices.
- Pricing injected into the AI prompt is **aliigo.com only**.
