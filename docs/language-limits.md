# Language Limits By Plan

This documents how `default_locale` + `enabled_locales` are enforced.

## Plan caps

- `basic`: 1 language
- `growth`: 2 languages
- `pro`: 3 languages
- `custom`: unrestricted

## Backend validation (`POST /api/settings/business`)

- Accepts:
  - `business.default_locale` (`en`/`es`)
  - `business.enabled_locales` (array)
- Normalization:
  - values are normalized to `en` or `es`
  - duplicates are removed
- Rules:
  - `enabled_locales` always includes `default_locale`
  - if requested languages exceed plan cap, request returns `400`
  - if `enabled_locales` is omitted, current DB value is used

## Embed behavior

- `/api/embed/session` and `/api/embed/preview-session` now return:
  - `locale` (default/fallback)
  - `locale_auto` (plan-gated)
  - `enabled_locales`
- Widget auto-detection only switches language if detected locale is inside `enabled_locales`.
