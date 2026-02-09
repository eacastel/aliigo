-- Records legal clickwrap acceptance for subscription agreement
create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  terms_version text not null,
  locale text,
  agreement text not null,
  marketing_opt_in boolean not null default false,
  ip text,
  user_agent text
);

create index if not exists legal_acceptances_user_id_idx
  on public.legal_acceptances (user_id);

create index if not exists legal_acceptances_agreement_idx
  on public.legal_acceptances (agreement);
