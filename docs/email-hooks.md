# Supabase Send Email Hook (Resend)

This project uses Supabase Auth **Send Email Hook** to deliver all auth emails via Resend,
with EN/ES localization and internal signup notifications.

## 1) Configure Supabase Auth Hook

In Supabase Dashboard:

- Go to **Auth → Hooks**
- Enable **Send Email Hook**
- Set the URL to:

```
https://YOUR_DOMAIN.com/api/auth/send-email-hook
```

Supabase will show a secret (format like `v1,whsec_...`).  
Save it as:

```
SEND_EMAIL_HOOK_SECRET
```

## 1b) Configure Supabase Auth Webhook (Welcome email)

In Supabase Dashboard:

- Go to **Auth → Webhooks**
- Enable **user.confirmed**
- Set the URL to:

```
https://YOUR_DOMAIN.com/api/auth/webhook
```

Supabase will show a secret (format like `v1,whsec_...`).  
Save it as:

```
AUTH_WEBHOOK_SECRET
```

## Email sending behavior

If **Email Provider** is enabled and **Send Email Hook** is enabled, Supabase will use the hook
to send emails (SMTP provider is not used). If the hook is disabled, Supabase will use the configured
SMTP provider. This project expects the hook to be enabled so all auth emails go through Resend.

## 2) Environment Variables

Required:

```
NEXT_PUBLIC_SUPABASE_URL=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Aliigo <hello@aliigo.com>
RESEND_TO_EMAIL=you@aliigo.com   # optional, for internal signup notifications
SEND_EMAIL_HOOK_SECRET=...
AUTH_WEBHOOK_SECRET=...
```

## 3) Email change mapping (important)

When `email_action_type` is `email_change`, Supabase uses counterintuitive field names:

- `token_hash_new` → current email (`user.email`) with `token`
- `token_hash` → new email (`user.email_new`) with `token_new`

If Secure Email Change is disabled, only one token/hash is present and the hook should send a single email.

## 3) Locale Support

- Locale is captured at signup and stored in `user_metadata.locale`.
- Emails to users use EN/ES based on this value.
- Internal admin emails are English.

## 4) Testing

- Create a new account (signup) → confirmation email (localized) + admin notification.
- Request password reset → recovery email (localized).

If emails are not sent, check Vercel logs for `/api/auth/send-email-hook`.
