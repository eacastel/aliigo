# WhatsApp Cloud API Integration

## Implemented (Phase 1)

- Webhook verification + receive endpoint:
  - `GET /api/webhooks/whatsapp`
  - `POST /api/webhooks/whatsapp`
- Signature validation via `X-Hub-Signature-256` (when `META_APP_SECRET` is set).
- Inbound text messages routed into existing conversation pipeline (`channel = whatsapp`).
- Outbound assistant replies sent through Meta Cloud API.
- Idempotency guard for inbound message IDs.
- Growth+ plan gating for WhatsApp channel usage.

## Required Environment Variables

- `META_WEBHOOK_VERIFY_TOKEN`  
  Verify token configured in Meta Webhooks.

- `META_WHATSAPP_ACCESS_TOKEN`  
  Permanent/long-lived token with WhatsApp messaging permissions.

- `META_APP_SECRET`  
  Optional but recommended. Enables webhook signature verification.

- `META_GRAPH_API_VERSION`  
  Optional (default: `v21.0`).

- `WHATSAPP_INTERNAL_TOKEN`  
  Internal token used by webhook route to call `/api/conversation` securely.

- `WHATSAPP_PHONE_NUMBER_MAP`  
  JSON map from Meta phone_number_id to `business_id`.
  Example:
  ```json
  {
    "123456789012345": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "987654321098765": "ffffffff-1111-2222-3333-444444444444"
  }
  ```

- `WHATSAPP_DEFAULT_BUSINESS_ID`  
  Optional fallback when no map entry exists (single-tenant setups).

## Webhook Setup (Meta)

1. In Meta App → WhatsApp → Configuration, set webhook URL:
   - `https://your-domain.com/api/webhooks/whatsapp`
2. Set verify token to match `META_WEBHOOK_VERIFY_TOKEN`.
3. Subscribe to message fields at minimum:
   - `messages`

## Meta UI Checklist (Step-by-Step)

### 1) Meta App + WhatsApp product

1. Go to `https://developers.facebook.com/apps`
2. Click **Create App**
3. Choose app type (Business is typical)
4. Add product: **WhatsApp**

### 2) Collect core IDs

In App Dashboard → WhatsApp → API Setup, copy:
- **Phone Number ID**
- **WhatsApp Business Account ID**

You’ll use **Phone Number ID** in `WHATSAPP_PHONE_NUMBER_MAP`.

### 3) Create production access token (recommended)

Use Business Manager System User (not temporary token):
1. Go to `business.facebook.com/settings`
2. Users → **System users**
3. Create/choose system user
4. Assign assets/permissions to WhatsApp Business Account
5. Generate token for your app with WhatsApp messaging permissions
6. Save as `META_WHATSAPP_ACCESS_TOKEN`

### 4) Configure webhook in Meta

App Dashboard → WhatsApp → Configuration:
1. Callback URL:
   - `https://aliigo.com/api/webhooks/whatsapp` (or your domain)
2. Verify token:
   - same value as `META_WEBHOOK_VERIFY_TOKEN`
3. Verify and save
4. Subscribe fields:
   - `messages` (required)
   - optionally `message_status` later

### 5) Configure Vercel env vars

Add these in Vercel (Production):

```bash
META_WEBHOOK_VERIFY_TOKEN=...
META_WHATSAPP_ACCESS_TOKEN=...
META_APP_SECRET=...
META_GRAPH_API_VERSION=v21.0
WHATSAPP_INTERNAL_TOKEN=...
WHATSAPP_PHONE_NUMBER_MAP={"<PHONE_NUMBER_ID>":"<BUSINESS_ID_UUID>"}
WHATSAPP_DEFAULT_BUSINESS_ID=<BUSINESS_ID_UUID>   # optional
```

Then redeploy.

### 6) Growth+ gate requirement

The mapped business must be on `growth`, `pro`, or `custom`.
Basic plan is blocked by design.

### 7) End-to-end test

1. Send a WhatsApp message to your connected number
2. Confirm webhook receives it
3. Confirm message is stored in `messages` with `channel='whatsapp'`
4. Confirm assistant reply is sent back to WhatsApp

## Common Errors / Fixes

- **Webhook verify fails (403)**  
  `META_WEBHOOK_VERIFY_TOKEN` mismatch.

- **Invalid signature (401)**  
  Missing/wrong `META_APP_SECRET` or request not from Meta.

- **No reply sent**  
  - bad `WHATSAPP_PHONE_NUMBER_MAP`
  - business plan is Basic
  - invalid/expired `META_WHATSAPP_ACCESS_TOKEN`

- **Graph API error 400/401/403**  
  Token scope/expiry issue or wrong phone-number-id context.

## Notes

- Current implementation supports **text inbound/outbound**.
- Non-text message types are ignored for now.
- For Basic plans, webhook returns channel-disabled fallback behavior.

## Quick Test

Webhook verification:
```bash
curl "https://your-domain.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=12345"
```

Should return:
```text
12345
```
