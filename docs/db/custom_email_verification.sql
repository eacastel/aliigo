-- Custom email verification (app-level)
-- Run this in Supabase SQL editor.

-- 1) Profile-level verification state
alter table public.business_profiles
  add column if not exists email_verified_at timestamptz null,
  add column if not exists email_verification_deadline timestamptz null;

-- 2) Verification tokens (signup + email change)
create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('signup', 'email_change')),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  sent_count int not null default 1,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_email_verification_tokens_user_purpose
  on public.email_verification_tokens(user_id, purpose, expires_at desc);

create index if not exists idx_email_verification_tokens_active
  on public.email_verification_tokens(expires_at)
  where used_at is null;

