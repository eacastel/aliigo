# LP Conversion Direction (Locked)

This document captures the final direction we agreed to for paid-traffic landing pages and signup conversion.  
Goal: reduce churn, keep implementation stable, and optimize for trial starts.

## Scope
- Applies to LP routes only:
  - `/en/lp/website-ai-assistant`
  - `/es/lp/asistente-web-ia`
- Does **not** change the main homepage information architecture.

## Final Decisions

### 1) LP header should be conversion-only
- Keep:
  - `Log in` (small)
  - `Start free trial` (primary CTA)
- Remove on LP only:
  - Pricing / Why Aliigo / Founder links
  - Language toggle
  - Mobile menu
- Reason: paid clicks should not leak into browse paths.

### 2) CTA intent must match destination
- If CTA label says `See pricing / Ver precios`, it must go to `#pricing` on the same LP.
- Do not send that CTA to signup.

### 3) Keyword/ad relevance alignment for chatbot ad groups
- Add one explicit chatbot line near LP hero top:
  - EN: `Website chatbot powered by your approved business content — not a generic bot.`
  - ES: `Chatbot IA para tu web — con respuestas de tu negocio (no un bot genérico).`
- Keep positioning as “assistant”, but include keyword vocabulary early.

### 4) Signup friction reduction (small, high-impact)
- Keep honeypot (`fax`) hidden (bot trap only, not user-facing).
- Add trial/billing reassurance near signup header:
  - EN: `No card required. No charge until the trial ends.`
  - ES: `Sin tarjeta. No se cobra hasta que termine la prueba.`
- On signup pages, hide non-essential nav controls (no language toggle / mobile menu).

### 5) No scheduling integration for now
- Do **not** add “Book setup call” yet.
- Reason: adds operational overhead (timezones, no-shows, tooling) before volume justifies it.
- Keep self-serve trial as primary conversion path.

## Current LP Component Direction
- Keep current LP structure; no major rebuild.
- Prioritize:
  - conversion-only header
  - early pricing visibility
  - clear CTA intent
  - fast signup

## Implemented in code
- LP-only header behavior and signup nav reduction:
  - `src/components/PublicHeaderNav.tsx`
  - `src/app/[locale]/(public)/layout.tsx`
- LP hero keyword line:
  - `src/components/home/LpHeroSection.tsx`
  - `src/messages/en.json`
  - `src/messages/es.json`
- Signup reassurance copy:
  - `src/app/[locale]/(public)/signup/page.tsx`
  - `src/messages/en.json`
  - `src/messages/es.json`

## QA checklist (pre-deploy)
1. EN/ES LP headers show only `Log in` + `Start free trial`.
2. `See pricing / Ver precios` jumps to `#pricing`.
3. Chatbot line visible in LP hero (EN/ES).
4. Signup pages show trial/billing reassurance.
5. Honeypot is still hidden and not visible in UI.
6. Non-LP public pages keep full navigation.

## Deferred items (explicitly not now)
- Demo booking / Calendly integration
- Additional LP section re-architecture
- Broad A/B test matrix before a stable baseline is measured

