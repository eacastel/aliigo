# Architecture

## Stack
- Next.js (App Router) + TypeScript
- next-intl for locale routing and message catalogs
- Supabase: Postgres + Auth
- Vercel Route Handlers for API endpoints
- OpenAI (optional) for assistant replies

## Core Concepts

### Multi-tenancy
- Each business is identified by `businesses.id`
- Widget access is controlled by:
  1) token → business_id mapping (embed_tokens)
  2) allowlisted domain(s) per business

### Embed Model (current)
- Web Component v1 (`public/widget/v1/aliigo-widget.js`) is the primary embed.
- Sessions are minted by `/api/embed/session` using `embed_key + host`.
- Tokens are short‑lived and host-validated.
- The widget persists local transcript with a 30‑minute TTL.

### Chat Pipeline (POST /api/conversation)
- Validate message
- Extract host from `Origin` or `Referer`
- Validate embed token → businessId
- Validate host against `businesses.allowed_domains`
- Rate limit by `ip + business_id`
- Create or continue a `conversation`
- Insert user message
- Fetch recent message history
- Build system prompt using business fields (and lead heuristic)
- Resolve display currency from request country headers (`x-vercel-ip-country` / `cf-ipcountry`) for Aliigo pricing snippets
- Call OpenAI
- Insert assistant message
- Return reply + structured actions
- Optional lead capture:
  - Widget can submit structured lead payload (name/email/phone/consent)
  - Leads are stored in `leads`
  - Lead notification emails are sent via Resend

## Security boundaries
- Browser Supabase client uses anon key and relies on Supabase Auth.
- Server routes use service role key (bypasses RLS). These routes must enforce tenant scoping in code.
- Domain allowlisting is critical for the widget.

## Billing flow notes
- Billing setup path: `POST /api/stripe/setup-intent` then `POST /api/stripe/subscribe` (`action=start`).
- Subscriptions are created with a 30-day trial and saved default payment method.
- At `trial_end`, Stripe attempts off-session payment automatically.
- `POST /api/stripe/webhook` is the source of truth sync for subscription/invoice status:
  - paid -> `active`
  - failed payment -> `past_due`
  - subscription delete/cancel updates local `billing_status` and period fields.
- `subscribe` now includes a guarded self-heal for stale Stripe customer IDs:
  - if SetupIntent customer differs from DB customer, adopt it only when SetupIntent metadata business id matches.
  - otherwise fail closed with customer mismatch.
- Plan pricing comes from env-bound currency price IDs in `src/lib/stripe.ts`.
- Stripe price env vars are validated at startup in `src/lib/stripe.ts` (fail-fast on missing/invalid values).
- Plan limits are synced from billing plan:
  - basic: 1 seat / 1 domain
  - growth: 3 seats / 1 domain
  - pro: 5 seats / 3 domains
  - custom: admin-defined
- Legacy compatibility:
  - Existing rows with `billing_plan='starter'` are treated as `basic` in runtime logic.
  - Optional cleanup migration: `docs/db/plan_rename_starter_to_basic.sql`

## Signup flow notes
- Public signup form now collects only:
  - email
  - business name
  - password
  - legal acceptance + optional marketing opt-in
- `name` and `phone` are no longer collected at signup and are no longer required dependencies for profile creation.
- Business name remains needed for initial workspace creation.
- Signup now routes users to `/dashboard` instead of `/check-email`.
- Custom verification is app-level and token-based:
  - `email_verification_tokens` stores hashed tokens for signup/email-change verification.
  - `business_profiles.email_verified_at` and `business_profiles.email_verification_deadline` drive dashboard verification state.
  - Verification links go to `/{locale}/verify-email`, then call `/api/verification/confirm`.
  - Dashboard shows unverified banner countdown:
    - >24h remaining: standard warning with hours left
    - <=24h remaining: final warning
    - <=0h: expired notice (scheduled-for-deletion state)
  - Cleanup endpoint `POST /api/admin/verification/cleanup` removes expired unverified accounts (requires `CRON_SECRET`).

## Known gaps to close (production hardening)
- CORS rules should remain strict (no wildcard in production)
- Token rotation and authenticated token management
- Optional: background reindexing for knowledge updates
