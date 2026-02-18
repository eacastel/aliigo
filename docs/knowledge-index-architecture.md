# Knowledge Index Architecture (RAG)

This schema supports both onboarding paths:

1. Website customers: crawl + index site pages.
2. No-website customers: manual FAQs + manual notes + file uploads.

## Tables

- `knowledge_documents`
  - one row per source document (website page, uploaded file, manual note, FAQ source)
- `knowledge_chunks`
  - chunked text + embedding for semantic retrieval
- `knowledge_faqs`
  - structured Q&A for fast onboarding when no website exists
- `knowledge_ingestion_runs`
  - audit trail for crawl/upload/manual indexing runs

## Why this works with current assistant settings

- `assistant_settings` remains the control layer (tone, behavior, qualification).
- `knowledge_*` becomes the retrieval layer (facts and source-grounded answers).
- Conversation API can:
  1) query top chunks by embedding similarity
  2) compose answer from retrieved chunks
  3) cite `source_url`/`source_label`

## Suggested rollout

1. Run `docs/db/knowledge_index.sql`.
2. Use `POST /api/knowledge/crawl` to populate `knowledge_documents/chunks`.
3. Add `POST /api/knowledge/faq` for manual Q&A.
4. Keep strict fallback when retrieved context is insufficient.

## Current implemented endpoints

- `POST /api/knowledge/crawl`
  - Auth required
  - Validates URL belongs to `allowed_domains`
  - Mode-aware crawl:
    - `website`: same-domain up to 20 pages, depth 2, 20s max
    - `single_page`: one URL only (maxPages=1, depth=0)
  - Chunks + embeds text and writes `knowledge_documents` + `knowledge_chunks`
  - Tracks run in `knowledge_ingestion_runs`

- `POST /api/settings/assistant/autofill`
  - Onboarding helper (draft suggestions)
  - Supports `merge` and `replace` draft generation modes
  - Does not replace full retrieval index

- `GET /api/knowledge/index-summary`
  - Returns totals, recent runs, and recent indexed documents with preview snippets

## Runtime safety updates

- Conversation replies now validate outbound URLs before returning them.
- Broken links are removed from response text/CTA actions.
- Same-domain locale repair is attempted (`/es/...` or `/en/...`) before dropping a link.
