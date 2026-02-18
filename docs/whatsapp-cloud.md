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

