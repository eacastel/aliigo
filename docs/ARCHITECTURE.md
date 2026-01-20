# Architecture

## Stack
- Next.js (App Router) + TypeScript
- next-intl for locale routing and message catalogs
- Supabase: Postgres + Auth
- Vercel Route Handlers for API endpoints
- OpenAI (optional) for assistant replies

## Core Concepts

### Multi-tenancy
- Each business is identified by `businesses.id`
- Widget access is controlled by:
  1) token → business_id mapping (embed_tokens)
  2) allowlisted domain(s) per business

### Embed Model (current)
- Widget is loaded via the embedded route `/[locale]/chat`
- Widget uses a token passed through query params (dev only)

### Chat Pipeline (POST /api/conversation)
- Validate message
- Extract host from `Origin` or `Referer`
- Validate embed token → businessId
- Validate host against `businesses.allowed_domains`
- Rate limit by `ip + business_id`
- Create or continue a `conversation`
- Insert user message
- Fetch recent message history
- Build system prompt using business fields (and lead heuristic)
- Call OpenAI
- Insert assistant message
- Return reply

## Security boundaries
- Browser Supabase client uses anon key and relies on Supabase Auth.
- Server routes use service role key (bypasses RLS). These routes must enforce tenant scoping in code.
- Domain allowlisting is critical for the widget.

## Known gaps to close (production hardening)
- CORS wildcard in conversation endpoint
- conversationId ownership verification
- token handling: avoid URL token passing; add public key → session token minting
- token rotation and authenticated token management
