# Billing & Currency Strategy

This document describes how Aliigo handles currency for pricing display and Stripe billing.

## Goal
- **EUR** for Europe
- **USD** for the US and rest of world
- Same numeric prices; only denomination changes per region

## How currency is selected
Currency is derived **only** from the request country header:
- Europe → `EUR`
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
STRIPE_PRICE_BASIC_EUR
STRIPE_PRICE_GROWTH_EUR
STRIPE_PRICE_PRO_EUR
STRIPE_PRICE_BASIC_USD
STRIPE_PRICE_GROWTH_USD
STRIPE_PRICE_PRO_USD
```

If using prod keys, mirror with your prod environment values.

## 30-day trial charge lifecycle
Aliigo uses Stripe subscriptions with a 30-day trial and saved payment method.

Sequence:
1) Customer enters card details in checkout (`SetupIntent`).
2) App calls `POST /api/stripe/subscribe` with `action=start`.
3) Subscription is created with:
   - `trial_period_days: 30`
   - `default_payment_method` from successful SetupIntent
   - `payment_settings.save_default_payment_method = on_subscription`
4) During trial, status is `trialing` and `trial_end` is stored in `businesses`.
5) At `trial_end`, Stripe automatically attempts to collect the first invoice off-session.
6) Stripe webhook updates local status:
   - success (`invoice.paid` / subscription active) -> `active`
   - failure (`invoice.payment_failed`) -> `past_due`

Cancellation behavior:
- If user cancels with `cancel_at_period_end: true` before trial ends, access continues through trial end and no post-trial renewal charge is made.
- If user resumes before trial/current period end, `cancel_at_period_end` is set back to `false`.

Plan-change behavior:
- Plan changes use `proration_behavior: none` to avoid surprise immediate charges.
- New plan applies on next billing boundary (for trial users: trial-end invoice).

## Where it’s applied in code
- `src/proxy.ts` handles locale routing and sets `aliigo_country_debug`
- `src/lib/currency.ts` helpers (country → currency)
- `src/lib/stripe.ts` maps currency → Stripe price IDs
- `src/app/api/stripe/subscribe/route.ts` creates subscription using currency
- `src/app/api/stripe/webhook/route.ts` syncs Stripe invoice/subscription events into `businesses`
- `src/app/api/conversation/route.ts` uses the same country-based currency for Aliigo pricing snippets
- Pricing UI:
  - `src/app/[locale]/(public)/page.tsx` → `HomePageClient` (server passes `initialCurrency`)
  - `src/app/[locale]/(public)/pricing/page.tsx`
  - `src/app/[locale]/(app)/dashboard/billing/page.tsx` → `BillingPageClient`
  - `src/components/billing/PlanSelector.tsx`

## Implementation notes (Feb 2026)
- `headers()` is async in this Next.js version; server wrappers must `await headers()` before calling `getCurrencyFromHeaders`.
- Any client components that need currency should receive it via props from a server wrapper (no cookies).
- Startup guard in `src/lib/stripe.ts` now validates required Stripe price env vars:
  - `STRIPE_PRICE_BASIC_EUR`
  - `STRIPE_PRICE_GROWTH_EUR`
  - `STRIPE_PRICE_PRO_EUR`
  - `STRIPE_PRICE_BASIC_USD`
  - `STRIPE_PRICE_GROWTH_USD`
  - `STRIPE_PRICE_PRO_USD`
  - Missing or malformed values fail fast at startup (`price_*` expected).
- Billing hardening in `src/app/api/stripe/subscribe/route.ts`:
  - On `start`, if Stripe returns a SetupIntent whose customer differs from `businesses.stripe_customer_id`, we now:
    - verify `setup_intent.metadata.business_id === current businessId`
    - update `businesses.stripe_customer_id` to the SetupIntent customer
    - continue subscription creation (self-heal path)
  - If metadata does not match, request still fails with `SetupIntent customer mismatch`.
- Stripe price lookup errors now include currency context:
  - `Missing Stripe price for plan: <plan> (<currency>)`
- Plan naming migration:
  - Canonical plan slugs are now `basic`, `growth`, `pro`, `custom`.
  - Runtime keeps temporary compatibility for legacy `starter` values.
  - Optional DB cleanup SQL: `docs/db/plan_rename_starter_to_basic.sql`.

## Notes
- Language is **not** tied to Stripe product/prices.
- Pricing injected into the AI prompt is **aliigo.com only**.

## Adding a new market/currency
When adding a new currency (for example GBP), update these pieces together:

1) Currency mapping
- `src/lib/currency.ts`
  - Extend `AliigoCurrency` union with the new code.
  - Update `normalizeCurrency`.
  - Update `currencyForCountry` with country -> currency rules.

2) Stripe price map + startup validation
- `src/lib/stripe.ts`
  - Add new currency price IDs to `PRICE_TABLE`.
  - Add required env vars to startup validation.
  - Keep one Stripe Product per plan, one Price per currency.

3) Environment variables
- Add new price IDs in all environments (local/staging/prod), e.g.:
  - `STRIPE_PRICE_STARTER_GBP`
  - `STRIPE_PRICE_GROWTH_GBP`

4) Formatting on UI
- Any page formatting money with `Intl.NumberFormat` must handle the new currency locale pairing.
- Current pages already consume a server-derived currency; only add locale mapping where needed.

5) API compatibility
- Confirm `POST /api/stripe/subscribe` accepts and uses the new currency via `normalizeCurrency`.
- Confirm plan change path (`action=change_plan`) resolves existing subscription currency correctly.

6) QA checklist
- Geo header for a country in the new market returns correct currency.
- Pricing page, homepage cards, and billing page show correct symbol/code.
- Checkout succeeds and creates subscription on the new currency prices.
- Plan upgrade/downgrade works without proration surprises.
