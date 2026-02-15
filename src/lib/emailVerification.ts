import { createHash, randomBytes } from "crypto";

type VerificationLocale = "en" | "es";
type VerificationPurpose = "signup" | "email_change";

export function createVerificationToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(token);
  return { token, tokenHash };
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://aliigo.com"
  ).replace(/\/+$/, "");
}

export function buildVerificationEmail(opts: {
  locale: VerificationLocale;
  purpose: VerificationPurpose;
  verifyUrl: string;
}) {
  const isEs = opts.locale === "es";
  const title =
    opts.purpose === "email_change"
      ? isEs
        ? "Confirma tu nuevo email"
        : "Confirm your new email"
      : isEs
      ? "Confirma tu email"
      : "Confirm your email";

  const body =
    opts.purpose === "email_change"
      ? isEs
        ? "Haz clic en el botón para confirmar el cambio de email en tu cuenta de Aliigo."
        : "Click the button to confirm the email change on your Aliigo account."
      : isEs
      ? "Haz clic en el botón para verificar tu email y mantener activa tu cuenta."
      : "Click the button to verify your email and keep your account active.";

  const buttonLabel = isEs ? "Verificar email" : "Verify email";
  const subject =
    opts.purpose === "email_change"
      ? isEs
        ? "Aliigo: confirma tu nuevo email"
        : "Aliigo: confirm your new email"
      : isEs
      ? "Aliigo: confirma tu email"
      : "Aliigo: confirm your email";

  const footer = isEs
    ? "Si no solicitaste esto, ignora este correo."
    : "If you did not request this, ignore this email.";

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111; background:#fff;">
      <div style="max-width:560px; margin:0 auto; padding:24px;">
        <div style="margin:0 0 16px;">
          <img src="https://aliigo.com/aliigo-logo-color.png" alt="Aliigo" width="120" style="display:block; max-width:120px; height:auto;" />
        </div>
        <h2 style="margin:0 0 10px;">${title}</h2>
        <p style="margin:0 0 16px; color:#333; font-size:14px;">${body}</p>
        <p style="margin:0 0 16px;">
          <a href="${opts.verifyUrl}" style="display:inline-block; padding:10px 16px; background:#84C9AD; color:#0b0b0b; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">
            ${buttonLabel}
          </a>
        </p>
        <p style="font-size:12px; color:#666; margin-top:16px;">
          <a href="${opts.verifyUrl}" style="color:#666; text-decoration:underline;">${opts.verifyUrl}</a>
        </p>
        <p style="font-size:12px; color:#666; margin-top:16px;">${footer}</p>
      </div>
    </div>
  `;

  const text = [title, body, opts.verifyUrl].join("\n");
  return { subject, html, text };
}
