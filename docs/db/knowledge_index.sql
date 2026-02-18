-- Knowledge Index (RAG) schema for Aliigo
-- Purpose:
-- 1) unify website crawl, file uploads, manual notes, and FAQs
-- 2) support retrieval during /api/conversation
-- 3) keep ingestion/audit traceable per business

-- 0) Optional but recommended for embeddings
create extension if not exists vector;

-- 1) Source documents (one row per crawled page / uploaded file / manual note)
create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_type text not null check (source_type in ('website','file','manual','faq')),
  source_url text null,
  source_label text null,
  locale text not null default 'en' check (locale in ('en','es')),
  checksum text null, -- helps detect unchanged pages/files
  status text not null default 'active' check (status in ('active','archived','error')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_documents_business
  on public.knowledge_documents(business_id);

create index if not exists idx_knowledge_documents_source_type
  on public.knowledge_documents(source_type);

create index if not exists idx_knowledge_documents_locale
  on public.knowledge_documents(locale);

create unique index if not exists ux_knowledge_documents_business_source
  on public.knowledge_documents(business_id, source_type, coalesce(source_url, ''), coalesce(source_label, ''), locale);

-- 2) Chunks for retrieval
create table if not exists public.knowledge_chunks (
  id bigserial primary key,
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  chunk_index int not null,
  locale text not null default 'en' check (locale in ('en','es')),
  content text not null,
  token_count int null,
  embedding vector(1536) null, -- set dimension to your embedding model
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_chunks_business
  on public.knowledge_chunks(business_id);

create index if not exists idx_knowledge_chunks_document
  on public.knowledge_chunks(document_id);

create index if not exists idx_knowledge_chunks_locale
  on public.knowledge_chunks(locale);

create unique index if not exists ux_knowledge_chunks_document_index
  on public.knowledge_chunks(document_id, chunk_index);

-- Vector index (optional at first; add once row count is meaningful)
-- create index if not exists idx_knowledge_chunks_embedding_cosine
--   on public.knowledge_chunks
--   using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);

-- 3) Structured FAQ source (easy for no-website customers)
create table if not exists public.knowledge_faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  locale text not null default 'en' check (locale in ('en','es')),
  question text not null,
  answer text not null,
  source_label text null default 'manual_faq',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_faqs_business
  on public.knowledge_faqs(business_id);

create index if not exists idx_knowledge_faqs_locale
  on public.knowledge_faqs(locale);

-- 4) Ingestion / crawl / upload run audit trail
create table if not exists public.knowledge_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('crawl','upload','manual','recrawl')),
  source_url text null,
  requested_by uuid null,
  status text not null default 'running' check (status in ('running','completed','failed','cancelled')),
  pages_scanned int not null default 0,
  documents_upserted int not null default 0,
  chunks_upserted int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz null
);

create index if not exists idx_knowledge_ingestion_runs_business
  on public.knowledge_ingestion_runs(business_id, started_at desc);

-- 5) updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_knowledge_documents_updated_at on public.knowledge_documents;
create trigger trg_knowledge_documents_updated_at
before update on public.knowledge_documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_knowledge_chunks_updated_at on public.knowledge_chunks;
create trigger trg_knowledge_chunks_updated_at
before update on public.knowledge_chunks
for each row execute function public.set_updated_at();

drop trigger if exists trg_knowledge_faqs_updated_at on public.knowledge_faqs;
create trigger trg_knowledge_faqs_updated_at
before update on public.knowledge_faqs
for each row execute function public.set_updated_at();

-- 6) RLS (dashboard user can only manage their own business rows)
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.knowledge_faqs enable row level security;
alter table public.knowledge_ingestion_runs enable row level security;

drop policy if exists knowledge_documents_owner_rw on public.knowledge_documents;
create policy knowledge_documents_owner_rw
on public.knowledge_documents
for all
using (
  exists (
    select 1
    from public.business_profiles bp
    where bp.id = auth.uid()
      and bp.business_id = knowledge_documents.business_id
  )
)
with check (
  exists (
    select 1
    from public.business_profiles bp
    where bp.id = auth.uid()
      and bp.business_id = knowledge_documents.business_id
  )
);

drop policy if exists knowledge_chunks_owner_rw on public.knowledge_chunks;
create policy knowledge_chunks_owner_rw
on public.knowledge_chunks
for all
using (
  exists (
    select 1
    from public.business_profiles bp
    where bp.id = auth.uid()
      and bp.business_id = knowledge_chunks.business_id
  )
)
with check (
  exists (
    select 1
    from public.business_profiles bp
    where bp.id = auth.uid()
      and bp.business_id = knowledge_chunks.business_id
  )
);

drop policy if exists knowledge_faqs_owner_rw on public.knowledge_faqs;
create policy knowledge_faqs_owner_rw
on public.knowledge_faqs
for all
using (
  exists (
    select 1
    from public.business_profiles bp
    where bp.id = auth.uid()
      and bp.business_id = knowledge_faqs.business_id
  )
)
with check (
  exists (
    select 1
    from public.business_profiles bp
    where bp.id = auth.uid()
      and bp.business_id = knowledge_faqs.business_id
  )
);

drop policy if exists knowledge_ingestion_runs_owner_read on public.knowledge_ingestion_runs;
create policy knowledge_ingestion_runs_owner_read
on public.knowledge_ingestion_runs
for select
using (
  exists (
    select 1
    from public.business_profiles bp
    where bp.id = auth.uid()
      and bp.business_id = knowledge_ingestion_runs.business_id
  )
);

-- Service role should handle writes for ingestion runs/chunks as needed.

