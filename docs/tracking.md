# Aliigo — Tracking Setup (Summary)

This document summarizes the tracking that is currently installed and what we should keep or remove to reduce noise.

## Container Summary (Current)
- GTM Container: `GTM-5GKT7R4R`
- GA4 Measurement ID: `G-EX6SZZH05W`
- Google Ads Tag: `AW-17774708004`

## Events Currently Installed (from GTM export v5)
**GA4**
- `account_confirmed` (GA4 event tag + custom event trigger)
- `generate_lead` (GA4 event tag + custom event trigger)

**Google Ads**
- `account_confirmed` (conversion tag)
- `generate_lead` (conversion tag)

**Meta**
- Base Pixel (PageView)
- `Lead` event (custom HTML tag, tied to `generate_lead`)

**Other**
- Conversion Linker
- CookieYes CMP

## Events We Want (Near-Term)
Primary conversion (optimize bidding on this):
- `trial_started`

Secondary conversions (track only for now):
- `signup_intent`
- `pricing_view`

## Recommended Keep / Remove (to reduce noise)
Keep:
- GA4 Config
- Google Ads base tag (`AW-17774708004`)
- Conversion Linker
- CookieYes CMP
- `account_confirmed` (GA4 + Ads)

Remove or pause (if not used in your funnel right now):
- `generate_lead` (GA4 + Ads)
- Meta Pixel + Meta Lead event

Rationale:
- If you are not optimizing for lead captures, it adds noise and may skew learning.
- If Meta campaigns are not active, keep them off until needed.

## Implementation Plan (Next)
We will add the following **dataLayer events** in the app:
- `trial_started` (fires when trial actually starts)
- `signup_intent` (fires when “Start free trial” is clicked)
- `pricing_view` (fires when pricing page is viewed)

Then in GTM:
- Create Custom Event triggers for each of the above.
- Create GA4 Event tags for each.
- Create a Google Ads Conversion tag **only** for `trial_started`.

## Notes
- Do not optimize on `signup_intent` in Google Ads; keep it as a secondary conversion.
- If you turn on Meta campaigns later, we can add a `StartTrial` event and map it to the same trigger.

## Current app event behavior (implemented)
- `pricing_view`
  - Fires when the pricing page is viewed (`/en/pricing` or `/es/precios`).
  - Implemented via pathname detection in `src/components/PublicTrackingEvents.tsx`.
- `signup_intent`
  - Fires when users click links that navigate to signup (`/signup` or `/registro`) on public pages.
  - Implemented via click listener in `src/components/PublicTrackingEvents.tsx`.
- `trial_started`
  - Fires after Stripe setup + subscription creation succeeds in checkout flow.
  - Implemented in `src/components/billing/PaymentForm.tsx`.
