# Assistant Settings Draft/Publish Workflow

## Current behavior

Assistant settings now use a two-step workflow in `dashboard/settings/assistant`:

1. `Save draft`
- Saves current form data into `businesses.assistant_settings.draft`.
- Does not change live assistant runtime fields (`system_prompt`, `knowledge`, `qualification_prompt`).

2. `Publish changes`
- Requires required fields to be present.
- Requires explicit authorization checkbox confirmation.
- Writes live runtime fields and clears the draft payload.

## Required field gate

Publishing is blocked when any required field is empty:
- Business summary
- What you do
- Key facts
- CTA URLs
- Support email

## Audit stamps

Timestamps and user ids are recorded inside `assistant_settings.workflow`:
- `lastDraftSavedAt`
- `lastDraftSavedBy`
- `lastPublishedAt`
- `lastPublishedBy`
- `lastMissingRequired`

## Draft payload shape

Stored under `assistant_settings.draft`:
- `form` (partial assistant form values)
- `sourceUrl` (reserved for autofill importer)
- `fieldStatuses` (`suggested|needs_review|missing`)
- `savedAt`
- `savedBy`

## Notes

- This uses existing JSON storage and does not require a DB migration.

## Website autofill (implemented)

- Endpoint: `POST /api/settings/assistant/autofill`
- Auth: requires bearer session token.
- Authorization: URL hostname must belong to the business `allowed_domains`.
- Crawl strategy: same-domain crawl, breadth-first.
- Limits:
  - max pages: `20`
  - max depth: `2`
  - hard timeout: `20s`
- Default exclusions:
  - admin/account/auth paths (`/admin`, `/dashboard`, `/login`, `/auth`, `/wp-admin`, etc.)
  - checkout/cart paths
  - non-HTML asset extensions (`.pdf`, images, `.zip`, `.xml`, `.json`)
  - URLs with `preview` or `token` query params
- Output:
  - `draftForm` suggestions for assistant fields
  - `fieldStatuses`
  - `sourceUrl`, `fetchedAt`, `pagesCrawled`

In UI (`dashboard/settings/assistant`):
- user enters an allowed URL
- clicks `Fetch suggestions`
- suggestions are merged into empty form fields
- then user can `Save draft` and later `Publish changes`
