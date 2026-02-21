# Dashboard Help Center (EN/ES)

This repo includes a logged‑in Help Center at:

```
/dashboard/help
```

It ships with EN/ES content and is intended for authenticated users only.

## Sections (current)

1) Getting Started  
2) Install the Widget  
3) Customize the Assistant  
4) Knowledge Onboarding (smart draft + website indexing)  
5) Support Panel (context overrides + support knowledge blocks)  
5) Billing & Plans
6) Partners & Affiliates

## Screenshot placeholders

The Help Center includes placeholder blocks for screenshots. Replace them with
real PNGs once you capture the UI. The placeholders are intentionally labeled
to match each section.

## Notes

- We can later expose the same content publicly for SEO.
- The current implementation is inside the dashboard only.
- Widget developer/security controls are separated from normal onboarding in:
  - `/dashboard/widget/advanced`
  - This keeps the main widget page focused on install + theme settings.
- The dashboard sidebar includes an `Advanced` link (above `Help`) that points to `/dashboard/widget/advanced`.
- Knowledge settings now include:
  - `Assistant setup` tab
  - `Indexed content` tab
  - `Support panel` opens a dedicated page at `/dashboard/settings/assistant/support`
- Widget controls now include:
  - `Installed signal` (validated domain + last seen)
  - `Widget live` toggle (show/hide public widget while keeping install active)
- Trial and entitlement UX now includes:
  - `Growth+` badges on gated capabilities (Knowledge and Business settings)
  - `Pro trial` and `Included in trial` badges when trial grants higher-tier access
  - Clearer domain error copy in Knowledge onboarding when a URL is outside allowed domains
- Loading UX is now standardized with one shared spinner component:
  - `src/components/ui/LoadingState.tsx`
  - Used across Dashboard, Business settings, Widget settings, and Knowledge pages
  - Prevents false `No linked business` flashes during initial load on Widget settings
