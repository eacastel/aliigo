# Supabase Send Email Hook (Resend)

This project uses Supabase Auth **Send Email Hook** to deliver all auth emails via Resend,
with EN/ES localization and internal signup notifications. The hook is the single source of truth
for auth emails (SMTP is not used when the hook is enabled).

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
```

## 3) Email change mapping (important)

When `email_action_type` is `email_change`, Supabase uses counterintuitive field names:

- `token_hash_new` → current email (`user.email`) with `token`
- `token_hash` → new email (`user.email_new`) with `token_new`

If Secure Email Change is disabled, only one token/hash is present and the hook should send a single email.

## 4) Locale Support

- Locale is captured at signup and stored in `user_metadata.locale`.
- Emails to users use EN/ES based on this value.
- Internal admin emails are English.

## 5) Email audit + welcome flag (optional but recommended)

Run the SQL in:

```
docs/db/email_audit.sql
```

This creates:
- `email_audit` table for logging sends
- `business_profiles.welcome_email_sent_at` to avoid duplicate welcome emails

## 6) Welcome email behavior (free plan)

On the free Supabase plan you can only configure one hook. The welcome email is sent from the
auth callback flow (not the hook) to avoid needing a second hook:

- `/[locale]/auth/callback` sends the **welcome email** after signup confirmation.
- This uses `business_profiles.welcome_email_sent_at` to avoid duplicates.

## 7) Lead notification emails (widget)

When a lead is submitted in the widget, a lead notification email is sent via Resend.
Locale for this email uses the business default locale (`businesses.default_locale`).
The email includes:

- Lead details (name, email, phone)
- A short conversation summary
- A link to the conversation in the dashboard

## 8) Testing

- Create a new account (signup) → confirmation email (localized) + admin notification.
- Request password reset → recovery email (localized).
- Submit a lead from the widget → lead notification email.

If emails are not sent, check Vercel logs for `/api/auth/send-email-hook`.
