create table if not exists public.pro_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  company text,
  website text,
  message text,
  locale text,
  source text,
  page_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text
);

alter table public.pro_inquiries enable row level security;
