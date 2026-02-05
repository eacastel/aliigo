# Aliigo

Aliigo is a multi-tenant SaaS platform for high-trust local businesses. The current focus is an embedded chat widget (iframe) backed by Supabase and Vercel Route Handlers, with tenant-specific prompts and domain allowlisting.

This repository is a Next.js (App Router) TypeScript application deployed on Vercel and connected to Supabase (Auth + Postgres).

---

## Current status

Branch: invite-waitlist

### Frontend
- Next.js App Router + TypeScript
- next-intl routing (src/i18n, src/messages)
- Public site routes under src/app/[locale]/(public)
- Embedded chat route under src/app/[locale]/chat

### Widget
- src/components/AliigoChatWidget.tsx
- Sends messages to POST /api/conversation
- Server derives businessId from token and validates allowed domains

### Backend (Vercel Route Handlers)
- POST /api/conversation  
  Domain gate → rate limit → database → OpenAI → database
- GET /api/support-token  
  Development helper only; must be replaced for production multi-tenant usage
- POST /api/meta-events  
  Meta Conversions API helper

### Supabase usage
- Browser client:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- Server routes:
  - SUPABASE_SERVICE_ROLE_KEY  
    This bypasses RLS; tenant scoping must be enforced in code

---

## Local development

### Requirements
- Node.js 18+ (recommended 20+)
- pnpm (preferred) or npm
- Supabase project with required tables
- OpenAI API key (optional)

### Install
git clone git@github.com:eacastel/aliigo.git  
cd aliigo  
git checkout invite-waitlist  
pnpm install

### Environment variables

Create a file named .env.local in the project root.

Public (browser):

NEXT_PUBLIC_SITE_URL=http://localhost:3000  
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL  
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY  
NEXT_PUBLIC_META_PIXEL_ID=YOUR_PIXEL_ID  

Server-only:

SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY  
OPENAI_API_KEY=YOUR_OPENAI_KEY  
OPENAI_MODEL=gpt-4o-mini  
META_CAPI_ACCESS_TOKEN=YOUR_META_TOKEN  

### Run
pnpm dev

### Open
- http://localhost:3000 (redirects to locale)
- http://localhost:3000/es/chat (embedded chat route)

---

## Embedded chat

### Current embedding method
The widget is embedded via an iframe.

Embed route:
- /[locale]/chat

Current development pattern:
- /es/chat?key=...&slug=...&brand=...

Important:  
Passing secret tokens in URLs is for development only.  
Production installs must use a public key → server-minted short-lived token flow.

---

## Conversation request flow

Endpoint: POST /api/conversation

1. Widget sends:
   token, conversationId (optional), message
2. Server:
   - extracts client host from Origin or Referer
   - validates token and resolves businessId
   - validates host against businesses.allowed_domains
   - applies rate limiting (ip + business)
   - creates or resumes conversation
   - stores user message
   - loads recent history
   - applies business system prompt
   - calls OpenAI (if configured)
   - stores assistant reply
3. Returns:
   conversationId and reply

---

## Supabase data model

### businesses
- id (uuid)
- slug (text)
- name (text)
- timezone (text)
- system_prompt (text, nullable)
- allowed_domains (text[])
- created_at (timestamptz)

### embed_tokens
- id (uuid)
- business_id (uuid)
- token (text)
- created_at (timestamptz)
- last_rotated_at (timestamptz, nullable)

### conversations
- id (uuid)
- business_id (uuid)
- channel (web, whatsapp, sms, email)
- external_ref (text, nullable)
- customer_name (text, nullable)
- status (text)
- created_at (timestamptz)

### messages
- id (uuid)
- conversation_id (uuid)
- channel (enum)
- role (enum)
- content (text)
- meta (jsonb)
- created_at (timestamptz)

### rate_events
- id (bigint)
- ip (inet)
- bucket (text)
- business_id (uuid, nullable)
- created_at (timestamptz)

### business_profiles
- id (uuid, equals auth.uid)
- business_id (uuid, nullable)
- nombre_negocio (text)
- nombre_contacto (text, nullable)
- telefono (text, nullable)
- email (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

---

## Row Level Security (RLS)

Enabled:
- business_profiles
- businesses
- embed_tokens

Disabled (recommended to enable for production dashboards):
- conversations
- messages
- rate_events

Notes:
- Service role bypasses RLS
- All server routes must enforce tenant scoping manually
- Dashboard reads should rely on RLS with anon key + auth session

---

## Deployment (Vercel)

1. Import repository into Vercel
2. Configure environment variables
3. Deploy

Canonical host:
- www.aliigo.com redirects to aliigo.com via middleware

---

## Security notes

Current:
- Tokens validated against database
- Domain allowlist enforced via Origin/Referer

Must fix before production:
- Do not pass secret tokens in URLs
- Remove CORS wildcard from protected endpoints
- Verify conversation ownership when resuming
- Replace /api/support-token with authenticated token management

---

## Roadmap

### MVP hardening
- Public embed key → server-minted short-lived token
- Strict CORS by allowed domain
- Conversation ownership validation
- Authenticated token rotation

### Productization
- Widget settings dashboard
- Copy-paste install snippet
- Business onboarding flow

### Monetization
- Stripe subscriptions
- Trial and upgrade flows

---

## Troubleshooting

Widget shows preview warning:
- Token missing → add token for dev or implement public-key flow

Domain not allowed:
- Add domain to businesses.allowed_domains

Generic replies:
- OPENAI_API_KEY missing

---

## License
Private / TBD
