# Seats & Domains Limits

## Plan policy (Phase B)
- Basic: `1 seat`, `1 domain`
- Growth: `3 seats`, `1 domain`
- Pro: `5 seats`, `3 domains`
- Custom: admin-defined (`seat_limit`, `domain_limit`)

## Data model
- `businesses.seat_limit` (nullable int)
- `businesses.domain_limit` (nullable int)

Migration:
- `docs/db/plan_limits.sql`
- `docs/db/plan_rename_starter_to_basic.sql` (optional cleanup for legacy rows)

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

## Related multilingual limits
- `docs/db/plan_language_limits.sql` adds `businesses.enabled_locales`.
- Language caps are enforced in `/api/settings/business` based on plan:
  - basic/starter: 1
  - growth: 2
  - pro: 3
  - custom: unlimited
