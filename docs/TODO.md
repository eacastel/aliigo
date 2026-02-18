# Pending Tasks

1. Remove hardcoded domains for Aliigo.com on src/app/api/embed/session/route.ts
2. Add Legal conditions.
3. Default language to browser language.
4. Create a new /(public)/subscribe for payflow outside gate.
5. Consider year paid in full for discount.

## Account & Profile UX (New)

1. Add editable email field in Business Settings.
2. On email change, require custom verification flow before applying the new email.
3. Add resend + pending-state UX for email change verification.
4. Encourage completion of contact profile data in Business Settings:
   - contact name
   - phone number
5. Add lightweight nudges in dashboard onboarding/checklist when contact name or phone is missing.

## Knowledge Index / RAG (New)

1. Add vector index once `knowledge_chunks` row count is meaningful:
   - `create index if not exists idx_knowledge_chunks_embedding_cosine`
   - `on public.knowledge_chunks`
   - `using ivfflat (embedding vector_cosine_ops)`
   - `with (lists = 100);`

2. Pass B follow-up:
   - Persist dismissed recommendations per-field across reloads.
   - Add optional dedicated monitor page with pagination/filtering for all indexed docs/runs.
