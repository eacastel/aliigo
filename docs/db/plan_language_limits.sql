-- Add multilingual settings to businesses.
-- Run once in Supabase SQL editor.

alter table public.businesses
  add column if not exists enabled_locales text[] not null default array['en']::text[];

-- Keep existing rows valid.
update public.businesses
set enabled_locales = case
  when default_locale is not null and lower(default_locale) like 'es%' then array['es']::text[]
  else array['en']::text[]
end
where enabled_locales is null
   or array_length(enabled_locales, 1) is null
   or array_length(enabled_locales, 1) = 0;

-- Optional sanity check.
select id, billing_plan, default_locale, enabled_locales
from public.businesses
order by created_at desc
limit 50;
