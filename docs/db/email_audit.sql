-- Email audit + welcome flag

-- 1) Audit table to trace outbound emails
create table if not exists public.email_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  event text not null,
  locale text,
  source text,
  payload jsonb
);

create index if not exists email_audit_email_idx on public.email_audit (email);
create index if not exists email_audit_event_idx on public.email_audit (event);
create index if not exists email_audit_created_at_idx on public.email_audit (created_at desc);

-- 2) Welcome email flag on business_profiles
alter table public.business_profiles
  add column if not exists welcome_email_sent_at timestamptz;
