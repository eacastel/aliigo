# Localization & Locale Cookies

## Locale selection (routing)
- Locale is determined by URL path (`/en`, `/es`).
- If a `NEXT_LOCALE` cookie exists, it **overrides** the path locale (we redirect to the cookie locale path).
- If no locale is in the path, we infer in this order:
  1) `NEXT_LOCALE` cookie (set by language switcher)
  2) Country headers
  3) Browser `Accept-Language`
- Locale routing and slug redirects are handled in `src/proxy.ts`.

## Language cookie
- The language switcher sets `NEXT_LOCALE` only (no currency cookie).
- `src/components/LanguageSwitcher.tsx` writes `NEXT_LOCALE` on toggle.
- `src/proxy.ts` sets `NEXT_LOCALE` to the path locale (or inferred locale during redirects).

## Currency (separate from locale)
- Currency is derived only from country headers (Europe → EUR, otherwise USD).
- Currency is **not** stored in cookies.
- See `docs/billing-currency.md` for details.
