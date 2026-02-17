-- Add persistent storage reference for widget header logo.
-- Requires Storage bucket: business-assets (private)

alter table public.businesses
  add column if not exists widget_header_logo_path text null;

-- Spot-check
select id, billing_plan, widget_header_logo_path
from public.businesses
order by created_at desc
limit 50;
