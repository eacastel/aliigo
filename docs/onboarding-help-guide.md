# Help Center Onboarding Guide
Step-by-step onboarding to go live fast and keep your assistant accurate over time.

## Quick links
- Widget settings
- Knowledge settings
- Messages
- Billing

> Tip: Run onboarding in this order: Business profile -> Widget install -> Knowledge onboarding -> test real conversations.

## 1) Getting Started
Create your workspace, confirm your email, and validate setup before going live.

1. Confirm your email to activate your account.
2. Complete your business profile in Business settings.
3. Open the Widget page to get your embed script.
4. Test the widget on your site and send a message.

_Screenshot placeholder: Business profile and dashboard overview._

## 2) Install the Widget
Add the script to your website and verify the widget appears and replies.

1. Copy the embed script from Dashboard -> Widget.
2. Paste it before the closing `</body>` tag on your site.
3. Publish changes and refresh your site.
4. Open a conversation to verify messages arrive.
5. In Dashboard -> Widget, confirm **Installed signal** shows your validated domain.
6. Use **Widget live** to control visibility:
   - ON: widget is visible on site
   - OFF: widget stays installed for ownership validation but is hidden to visitors

### Embed script
```html
<script async src="https://aliigo.com/widget/v1/aliigo-widget.js"></script>
<aliigo-widget embed-key="YOUR_EMBED_KEY"></aliigo-widget>
```

### Troubleshooting
- Make sure the script is loaded on every page you want to support.
- Disable ad blockers for a quick test.
- Confirm your domain is allowed in Widget settings.
- If indexing is blocked, load one page with the widget installed first so the domain heartbeat is recorded.

_Screenshot placeholder: Widget settings with embed key._

## 3) Customize the Assistant
Make the assistant sound like your brand and answer accurately.

- Update your business knowledge: services, policies, hours, and FAQs.
- Set tone and instructions in Knowledge settings.
- Choose a default language and test with real questions.
- Enable lead capture and notifications if you want follow-ups.

_Screenshot placeholder: Knowledge settings + knowledge base._

## 4) Knowledge Onboarding
Use onboarding assistance to build a clean setup draft and index website content for live answers.

1. In Knowledge settings, go to Onboarding assistance.
2. Click **Generate setup draft** to prefill core fields from your site.
3. Review each suggestion and choose **Keep original** or **Use suggestion**.
4. Run **Index website** to crawl allowed pages and build retrieval chunks.
5. Use **Add single page** to include important URLs that were missed.
6. Confirm authorization and **Publish** to apply changes live.

### Best practices
- Keep factual fields concise and business-specific.
- Re-run indexing after major website updates.
- Prefer policy/service pages over generic marketing pages.
- Test with 5-10 real customer questions after publishing.

_Screenshot placeholder: Onboarding assistance + indexed content monitor._

## 5) Billing & Plans
Start your free trial and manage your subscription.

- You get a 30-day free trial on Basic or Growth.
- Cancel anytime before the trial ends to avoid charges.
- Upgrade or downgrade anytime from Billing.
- Pro and Custom plans are tailored -> contact sales for setup.

## 6) Context Modes And Agent Overrides
Use this to avoid rigid routing and let one assistant handle mixed intent safely.

### Core idea
- `sales`: acquisition and conversion (pricing, trial, signup, booking).
- `support`: operational help (FAQ, policy, logistics, existing-user help).
- `catalog`: structured offerings (services/programs/products, comparisons, recommendations).

### Resolution order (recommended)
1. Explicit override from user journey (URI/context rule)
2. Audience classification
3. Current intent from the latest user message
4. Fallback to business default mode

### Agent override behavior
- The agent may switch mode when intent is clear.
- Keep one active mode per turn.
- Avoid rapid back-and-forth switching.
- Log each mode switch with reason (`intent`, `uri`, `audience`).

### Example override rules
- URI contains `/pricing`, `/book`, `/start` -> `sales`
- URI contains `/faq`, `/support`, `/portal` -> `support`
- URI contains `/services`, `/programs`, `/products`, `/menu` -> `catalog`

### AVAST example (parents, teachers, partners)
- First classify audience:
  - Parent / Guardian
  - Teacher
  - Business / Partner
- Then route by intent:
  - Parent + enrollment/pricing -> `sales`
  - Parent + schedules/policies/logistics -> `support`
  - Teacher + curriculum/program info -> `catalog` (or `support` for process questions)
  - Partner + sponsorship/collaboration -> `sales`

### Medical/Fertility clinic example
- Business default: `support`
- URI overrides:
  - `/treatments`, `/ivf`, `/iui`, `/services` -> `catalog`
  - `/book`, `/consultation`, `/new-patient` -> `sales`
  - `/faq`, `/patient-resources`, `/portal` -> `support`

## 7) Support Panel Knowledge Organization
When support panel is enabled, structure support knowledge into three blocks.

### Concepts and definitions
- Core terms users ask about repeatedly
- Program/service definitions
- Eligibility and plain-language meanings

### Procedures and steps
- Step-by-step onboarding flows
- Setup and troubleshooting paths
- What users should do first, second, and next

### Rules and escalation limits
- What the assistant can answer directly
- What requires human follow-up
- Safety/compliance boundaries and response limits
