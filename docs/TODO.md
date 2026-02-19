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

3. Advanced setup quality:
   - Improve generated advanced-field recommendations (scope/style/qualification/instructions) so they are higher quality and less generic.
   - Generate conversation-oriented guidance (rapport and follow-up behavior), not only factual snippets.
   - Keep strict validation and source-grounding to reduce off-topic answers.

4. Knowledge completeness and ingestion UX:
   - Make indexed-content monitor show full coverage clearly (all pages/docs/chunks with pagination/search).
   - Add manual “add single page” + full website indexing paths with explicit overwrite/merge behavior.
   - Add URL health checks for indexed links (detect/remove dead links).

5. Document ingestion (Pro+ / Custom):
   - Add secure file upload pipeline (PDF/TXT/CSV/MD) into `knowledge_documents` + `knowledge_chunks`.
   - Parse, chunk, embed, and expose uploaded docs in monitor and assistant retrieval.
   - Define limits by plan (file types, max size, max files, total storage).

## Plan Enforcement / Downgrade Safety

1. Enforce **access gating, not deletion** on downgrade:
   - Keep historical data (domains, indexed docs/chunks, advanced settings, logos).
   - Block feature usage above current plan limits.
   - Restore access automatically on re-upgrade.

2. Domains:
   - Enforce effective domain allowance by plan (`basic:1`, `growth:1`, `pro:3`, `custom:unlimited`) at runtime in embed/session checks.
   - If stored domains exceed limit after downgrade, mark extras as locked/inactive without deleting.

3. Knowledge indexing / retrieval:
   - Basic: block indexing + retrieval from indexed knowledge.
   - Growth+: allow.
   - Keep indexed assets in DB on downgrade, but ignore them while plan is below entitlement.

4. Advanced assistant controls:
   - Basic: tone only.
   - Growth+: full advanced controls.
   - Preserve advanced values in storage when downgraded; hide/lock in UI and API.

5. Admin operations:
   - Add internal admin account + safe impersonation flow to access a tenant as support without sharing credentials.
   - Log impersonation start/end, actor, target business, and reason (audit trail).
   - Restrict impersonation to explicit admin role only.

## WhatsApp Integration (Next Priority)

1. Phase 1 complete:
   - `/api/webhooks/whatsapp` wired for verify + inbound text handling.
   - Inbound mapped to business routing (`WHATSAPP_PHONE_NUMBER_MAP`) and sent to `/api/conversation`.
   - Outbound replies sent via Meta Cloud API.
   - Messages persisted in existing tables with `channel='whatsapp'`.
   - Growth+ gating enforced before processing.
   - Idempotency guard for inbound `wa_message_id`.

2. Next:
   - Add delivery status sync (`sent`, `delivered`, `read`) into message metadata.
   - Add support for media/template and 24-hour session fallback behavior.
   - Add stronger abuse controls/rate limiting specific to WhatsApp channel.
   - Add dashboard WhatsApp connectivity/config UI.
