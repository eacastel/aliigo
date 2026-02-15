# Seats & Domains Limits

## Plan policy (Phase B)
- Starter: `1 seat`, `1 domain`
- Growth: `3 seats`, `4 domains`
- Pro/custom: admin-defined (`seat_limit`, `domain_limit`)

## Data model
- `businesses.seat_limit` (nullable int)
- `businesses.domain_limit` (nullable int)

Migration:
- `docs/db/plan_limits.sql`

## Enforcement points
1) Billing lifecycle updates
- `src/app/api/stripe/subscribe/route.ts`
  - On `start` and `change_plan`, plan limits are written to `businesses`.
- `src/app/api/stripe/webhook/route.ts`
  - On subscription events, plan limits are synced from resolved plan.

2) Business settings domain updates
- `src/app/api/settings/business/route.ts`
  - Domain writes are checked against effective `domain_limit`.
  - Domain limit check is done on normalized base domains.
  - Stored `allowed_domains` still includes both root + `www` variants for each base domain.

## Notes
- Business settings UI now accepts multiple domains (one base domain per line).
- Backend now supports multi-domain validation against plan limits for future UI expansion.
- Seat invite/member flows are planned for Phase C.
