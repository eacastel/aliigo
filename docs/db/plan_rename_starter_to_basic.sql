-- Rename legacy billing plan value from starter -> basic
-- Safe to run multiple times.

begin;

update public.businesses
set billing_plan = 'basic'
where billing_plan = 'starter';

-- Re-apply canonical limits for renamed rows.
update public.businesses
set
  seat_limit = 1,
  domain_limit = 1
where billing_plan = 'basic'
  and (
    seat_limit is null
    or seat_limit < 1
    or domain_limit is null
    or domain_limit < 1
  );

commit;

