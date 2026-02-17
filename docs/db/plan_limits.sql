-- Plan limits for seats/domains
-- Current model: Basic=1 seat/1 domain, Growth=3 seats/1 domain, Pro=5 seats/3 domains, Custom=admin-defined.

alter table public.businesses
  add column if not exists seat_limit integer,
  add column if not exists domain_limit integer;

-- Backfill from current billing_plan for known plans.
update public.businesses
set
  seat_limit = case
    when billing_plan in ('basic','starter') then 1
    when billing_plan = 'growth' then 3
    when billing_plan = 'pro' then 5
    else seat_limit
  end,
  domain_limit = case
    when billing_plan in ('basic','starter') then 1
    when billing_plan = 'growth' then 1
    when billing_plan = 'pro' then 3
    else domain_limit
  end
where billing_plan in ('basic', 'starter', 'growth', 'pro');

-- Safety constraints (allow null for custom/pro until admin sets).
alter table public.businesses
  drop constraint if exists businesses_seat_limit_check,
  add constraint businesses_seat_limit_check
    check (seat_limit is null or seat_limit >= 1);

alter table public.businesses
  drop constraint if exists businesses_domain_limit_check,
  add constraint businesses_domain_limit_check
    check (domain_limit is null or domain_limit >= 1);
