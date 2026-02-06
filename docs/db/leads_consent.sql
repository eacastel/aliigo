-- Optional: store consent on leads

alter table public.leads
  add column if not exists consent boolean;
