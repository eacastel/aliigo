# Custom Email Verification

This project now supports app-level email verification with a 72-hour deadline.

## Why
- Keeps verification under Aliigo control (signup + email change).
- Supports dashboard banner countdown and deletion policy.
- Decouples verification from provider-specific auth email behavior.

## Database
Run:

`docs/db/custom_email_verification.sql`

This adds:
- `business_profiles.email_verified_at`
- `business_profiles.email_verification_deadline`
- `email_verification_tokens` table

## API routes
- `POST /api/verification/send`
  - Auth required (`Authorization: Bearer <access_token>`)
  - Sends verification email for:
    - `purpose: "signup"`
    - `purpose: "email_change"` (requires `email` in body)

- `POST /api/verification/send-initial`
  - No auth required (signup window only)
  - Used when signup returns no session.
  - Requires `{ userId, email, locale }`.

- `POST /api/verification/confirm`
  - Public token confirmation endpoint.
  - Marks token used and sets `business_profiles.email_verified_at`.
  - For `email_change`, updates auth user email and profile email.

- `POST /api/settings/business/email-change`
  - Auth required (`Authorization: Bearer <access_token>`).
  - Creates `email_change` verification token and sends confirmation to target email.
  - Applies email change only after `/api/verification/confirm`.
- `GET /api/settings/business/email-change`
  - Auth required (`Authorization: Bearer <access_token>`).
  - Returns current pending email-change target (if any active unexpired token exists).

- `POST /api/admin/verification/cleanup`
  - Deletes expired unverified auth users.
  - Requires header `x-cron-secret` matching `CRON_SECRET`.

## Pages / client flow
- Signup (`/signup`) sends verification email in background after auth signup.
- Verification link lands on:
  - `/{locale}/verify-email?token=...`
  - Calls `/api/verification/confirm`
  - Tracks `account_confirmed` and redirects to dashboard/login.
- Dashboard resend button uses custom send API.
- Verification banner is rendered from dashboard layout, so it appears on all dashboard pages.
- Verification countdown is based on:
  - `email_verification_deadline`
  - `email_verified_at`
- Verification email template includes Aliigo logo/header (same branded style used in auth emails).

## Required env vars
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL` (recommended; falls back to `https://aliigo.com`)
- `CRON_SECRET` (for cleanup endpoint)

## Recommended cron
- Pro plan: run cleanup hourly.
- Hobby plan: run cleanup daily.
- Endpoint: `POST /api/admin/verification/cleanup`
- Header: `x-cron-secret: <CRON_SECRET>`
