import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import {
  buildAdminSignupEmail,
  buildAuthEmail,
  normalizeLocale,
} from "@/emails/auth/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HookPayload = {
  user: {
    id: string;
    email: string;
    email_new?: string | null;
    user_metadata?: Record<string, unknown> | null;
  };
  email_data: {
    token: string | null;
    token_hash: string | null;
    token_hash_new?: string | null;
    token_new?: string | null;
    email_action_type: string;
    redirect_to?: string | null;
    site_url?: string | null;
  };
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getHookSecret() {
  const raw = requireEnv("SEND_EMAIL_HOOK_SECRET");
  return raw
    .replace("v1,whsec_", "")
    .replace("whsec_", "")
    .replace("v1,", "");
}

function buildVerifyUrl(
  action: string,
  tokenHash: string | null,
  redirectTo?: string | null
) {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!tokenHash) return "";
  const url = new URL("/auth/v1/verify", supabaseUrl);
  url.searchParams.set("token", tokenHash);
  url.searchParams.set("type", action);
  if (redirectTo) url.searchParams.set("redirect_to", redirectTo);
  return url.toString();
}

async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("RESEND_FROM_EMAIL");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${details}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    const wh = new Webhook(getHookSecret());
    const verified = wh.verify(payload, headers) as HookPayload;

    const action = verified.email_data.email_action_type;
    const user = verified.user;
    const meta = user.user_metadata ?? {};
    const locale = normalizeLocale(
      typeof meta.locale === "string" ? meta.locale : null
    );

    const sendUser = async (opts: {
      email: string;
      token: string | null;
      tokenHash: string | null;
      redirectTo?: string | null;
      isEmailChangeNew?: boolean;
    }) => {
      const confirmUrl = buildVerifyUrl(action, opts.tokenHash, opts.redirectTo);
      if (!confirmUrl) {
        throw new Error("Missing token_hash for auth email");
      }
      const template = buildAuthEmail({
        action,
        locale,
        email: opts.email,
        confirmUrl,
        token: opts.token,
        tokenHash: opts.tokenHash,
        siteUrl: verified.email_data.site_url ?? null,
        isEmailChangeNew: opts.isEmailChangeNew,
      });

      await sendResendEmail({
        to: opts.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    };

    if (action === "email_change") {
      let sent = false;

      if (user.email && verified.email_data.token_hash_new) {
        await sendUser({
          email: user.email,
          token: verified.email_data.token,
          tokenHash: verified.email_data.token_hash_new,
          redirectTo: verified.email_data.redirect_to,
          isEmailChangeNew: false,
        });
        sent = true;
      }

      if (user.email_new && verified.email_data.token_hash) {
        await sendUser({
          email: user.email_new,
          token: verified.email_data.token_new ?? verified.email_data.token,
          tokenHash: verified.email_data.token_hash,
          redirectTo: verified.email_data.redirect_to,
          isEmailChangeNew: true,
        });
        sent = true;
      }

      if (!sent && user.email && verified.email_data.token_hash) {
        await sendUser({
          email: user.email,
          token: verified.email_data.token,
          tokenHash: verified.email_data.token_hash,
          redirectTo: verified.email_data.redirect_to,
          isEmailChangeNew: false,
        });
      }
    } else {
      await sendUser({
        email: user.email,
        token: verified.email_data.token,
        tokenHash: verified.email_data.token_hash,
        redirectTo: verified.email_data.redirect_to,
      });
    }

    if (action === "signup") {
      const adminTo = process.env.RESEND_TO_EMAIL;
      if (adminTo) {
        const adminTemplate = buildAdminSignupEmail({
          email: user.email,
          fullName:
            typeof meta.full_name === "string" ? meta.full_name : null,
          businessName:
            typeof meta.business_name === "string" ? meta.business_name : null,
          locale:
            typeof meta.locale === "string" ? meta.locale : null,
          signupUrl: verified.email_data.redirect_to ?? null,
        });

        await sendResendEmail({
          to: adminTo,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
          text: adminTemplate.text,
        });
      }
    }

    return json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ ok: false, error: msg }, 400);
  }
}
