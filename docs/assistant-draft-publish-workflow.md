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
- `fieldProvenance` (`manual|suggested`)
- `generationMode` (`merge|replace`)
- `generatorVersion` (e.g. `autofill-v2`)
- `savedAt`
- `savedBy`

## Notes

- This uses existing JSON storage and does not require a DB migration.

## Onboarding assistance (implemented)

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
  - `mode` (`merge` or `replace`)
  - `sourceUrl`, `fetchedAt`, `pagesCrawled`

In UI (`dashboard/settings/assistant`):
- user enters an allowed URL
- clicks `Generate setup draft` (`merge`)
- or clicks `Regenerate and replace draft` (`replace`)
- then user can `Save draft` and later `Publish changes`

## Pass B (implemented): advanced recommendations

Autofill now also generates optional advanced recommendations for:
- `scope`
- `styleRules`
- `additionalInstructions`
- `qualificationPrompt`

Each recommendation includes:
- confidence (`low|medium|high`)
- rationale
- source URLs

UI actions per field:
- `Apply` (writes suggestion to field)
- `Keep original` (dismiss suggestion)
- `Clear` (clear field text)

## Knowledge monitor (implemented)

In Assistant settings, indexed content is available in a dedicated tab:
- `Assistant setup`
- `Indexed content`

Indexed content tab includes:
- totals: documents/chunks
- latest ingestion run status and timestamps
- paginated indexed pages with chunk counts and preview snippets

Backed by:
- `GET /api/knowledge/index-summary`

## Support panel split (implemented)

Support context configuration was moved to a dedicated page:

- `/dashboard/settings/assistant/support`

Main assistant page (`/dashboard/settings/assistant`) keeps:
- `Assistant setup`
- `Indexed content`
- top link to `Support panel`

Support panel stores config in:
- `businesses.assistant_settings.supportPanel`

Current shape:
- `enabled`
- `defaultMode` (`support|sales|catalog`)
- `overrides.signedIn`
- `overrides.uri` (`patterns[]`)
- `overrides.intent` (`terms[]`, `requireConfirmation`)
- `knowledge.concepts`
- `knowledge.procedures`
- `knowledge.rules`

## Runtime behavior alignment (implemented)

- Conversation API reads `assistant_settings.supportPanel` and resolves active context per turn.
- Support pill widget now uses same-origin API base in local dev to avoid environment drift (`window.location.origin`).
- Floating support pill now receives/sends header-logo metadata (`show_header_icon` + signed `theme.headerLogoUrl`) so it matches preview behavior.
- Widget header logo alignment was normalized by rendering logo inside the header flex row (instead of absolute positioning).
