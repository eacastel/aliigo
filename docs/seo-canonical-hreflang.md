# Canonical and Hreflang Setup

This project uses page-level metadata to define canonical URLs and EN/ES language alternates.

## Implementation

- Helper: `src/lib/localePageMetadata.ts`
  - `buildLocalePageMetadata({ locale, title, description, enPath, esPath })`
- Legal helper: `src/lib/legalMetadata.ts`
  - `buildLegalMetadata({ locale, title, description, enPath, esPath })`
- Localized path mapping source of truth: `src/i18n/routing.ts`

Each page that exports `generateMetadata` should set:

- `alternates.canonical`
- `alternates.languages.en`
- `alternates.languages.es`

## Pages Covered

### Public marketing pages

- `/en` ↔ `/es`
- `/en/pricing` ↔ `/es/precios`
- `/en/lp/website-ai-assistant` ↔ `/es/lp/asistente-web-ia`
- `/en/why-aliigo` ↔ `/es/por-que-aliigo`
- `/en/founder` ↔ `/es/fundador`

### Legal pages

- `/en/legal/legal-notice` ↔ `/es/legal/aviso-legal`
- `/en/legal/privacy` ↔ `/es/legal/privacidad`
- `/en/legal/cookies` ↔ `/es/legal/cookies`
- `/en/legal/terms-of-use` ↔ `/es/legal/terminos`
- `/en/legal/subscription-agreement` ↔ `/es/legal/acuerdo-suscripcion`
- `/en/legal/dpa` ↔ `/es/legal/dpa`
- `/en/legal/subprocessors` ↔ `/es/legal/subprocessors`
- `/en/legal/data-deletion` ↔ `/es/legal/eliminacion-datos`

## Footer Links

- Public footer includes the full legal links + Data Deletion page.
- Dashboard footer now includes the same legal/company links for consistency.

## Notes

- Some auth/client-only pages currently do not export page-level metadata because they are client pages (`\"use client\"`), and Next.js metadata exports are server-only.
- If needed, those can be migrated to server wrappers to add route-specific canonical/hreflang.

