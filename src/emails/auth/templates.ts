type Locale = "en" | "es";
type AuthAction =
  | "signup"
  | "recovery"
  | "magiclink"
  | "invite"
  | "email_change"
  | string;

export type AuthEmailInput = {
  action: AuthAction;
  locale: Locale;
  email: string;
  confirmUrl: string;
  token: string | null;
  tokenHash: string | null;
  siteUrl?: string | null;
  isEmailChangeNew?: boolean;
};

function t(locale: Locale) {
  return {
    brand: "Aliigo",
    footer: locale === "es" ? "Si no solicitaste esto, ignora este correo." : "If you did not request this, ignore this email.",
    button: locale === "es" ? "Continuar" : "Continue",
    signup: {
      subject: locale === "es" ? "Confirma tu cuenta de Aliigo" : "Confirm your Aliigo account",
      title: locale === "es" ? "Confirma tu cuenta" : "Confirm your account",
      body:
        locale === "es"
          ? "Gracias por crear tu cuenta en Aliigo. Confirma tu email para activar el acceso."
          : "Thanks for creating your Aliigo account. Confirm your email to activate access.",
    },
    recovery: {
      subject: locale === "es" ? "Restablecer contraseña de Aliigo" : "Reset your Aliigo password",
      title: locale === "es" ? "Restablecer contraseña" : "Reset password",
      body:
        locale === "es"
          ? "Hemos recibido una solicitud para restablecer tu contraseña. Usa el enlace o el código OTP."
          : "We received a request to reset your password. Use the link or OTP code.",
    },
    magiclink: {
      subject: locale === "es" ? "Tu enlace mágico de Aliigo" : "Your Aliigo magic link",
      title: locale === "es" ? "Iniciar sesión" : "Sign in",
      body:
        locale === "es"
          ? "Usa este enlace para iniciar sesión en Aliigo."
          : "Use this link to sign in to Aliigo.",
    },
    invite: {
      subject: locale === "es" ? "Te invitaron a Aliigo" : "You were invited to Aliigo",
      title: locale === "es" ? "Aceptar invitación" : "Accept invitation",
      body:
        locale === "es"
          ? "Has recibido una invitación para unirte a Aliigo."
          : "You have been invited to join Aliigo.",
    },
    emailChange: {
      subject:
        locale === "es" ? "Confirma el cambio de email" : "Confirm your email change",
      title:
        locale === "es" ? "Confirma el cambio de email" : "Confirm email change",
      body:
        locale === "es"
          ? "Confirma este cambio para actualizar tu email en Aliigo."
          : "Confirm this change to update your Aliigo email.",
    },
  };
}

function wrapHtml(content: string, locale: Locale) {
  const strings = t(locale);
  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111; background:#ffffff;">
    <div style="max-width:560px; margin:0 auto; padding:24px;">
      <div style="font-weight:700; font-size:18px; margin-bottom:12px;">${strings.brand}</div>
      ${content}
      <p style="font-size:12px; color:#666; margin-top:24px;">${strings.footer}</p>
    </div>
  </div>
  `;
}

export function buildAuthEmail(input: AuthEmailInput) {
  const strings = t(input.locale);
  const action = input.action;

  const bodyMap = {
    signup: strings.signup,
    recovery: strings.recovery,
    magiclink: strings.magiclink,
    invite: strings.invite,
    email_change: strings.emailChange,
  } as const;

  const fallback = strings.signup;
  const content = bodyMap[action as keyof typeof bodyMap] ?? fallback;

  const otpBlock = input.token
    ? `<p style="margin:16px 0 0; font-size:14px; color:#333;">OTP: <strong>${input.token}</strong></p>`
    : "";

  const html = wrapHtml(
    `
    <h2 style="margin:0 0 8px;">${content.title}</h2>
    <p style="margin:0 0 16px; color:#333; font-size:14px;">${content.body}</p>
    <p style="margin:0 0 16px;">
      <a href="${input.confirmUrl}" style="display:inline-block; padding:10px 16px; background:#111; color:#fff; text-decoration:none; border-radius:8px; font-size:14px;">
        ${strings.button}
      </a>
    </p>
    ${otpBlock}
    `,
    input.locale
  );

  const text = [
    content.title,
    content.body,
    input.confirmUrl,
    input.token ? `OTP: ${input.token}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: content.subject,
    html,
    text,
  };
}

export function buildAdminSignupEmail(opts: {
  email: string;
  fullName?: string | null;
  businessName?: string | null;
  locale?: string | null;
  signupUrl?: string | null;
}) {
  const subject = "New Aliigo signup";
  const lines = [
    `Email: ${opts.email}`,
    `Name: ${opts.fullName ?? "-"}`,
    `Business: ${opts.businessName ?? "-"}`,
    `Locale: ${opts.locale ?? "-"}`,
    opts.signupUrl ? `Signup URL: ${opts.signupUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapHtml(
    `
    <h2 style="margin:0 0 8px;">New Aliigo signup</h2>
    <table style="border-collapse:collapse; width:100%; font-size:14px;">
      <tr><td style="padding:6px 0; color:#555;">Email</td><td style="padding:6px 0;">${opts.email}</td></tr>
      <tr><td style="padding:6px 0; color:#555;">Name</td><td style="padding:6px 0;">${opts.fullName ?? "-"}</td></tr>
      <tr><td style="padding:6px 0; color:#555;">Business</td><td style="padding:6px 0;">${opts.businessName ?? "-"}</td></tr>
      <tr><td style="padding:6px 0; color:#555;">Locale</td><td style="padding:6px 0;">${opts.locale ?? "-"}</td></tr>
    </table>
    ${opts.signupUrl ? `<p style="margin-top:12px;"><a href="${opts.signupUrl}">${opts.signupUrl}</a></p>` : ""}
    `,
    "en"
  );

  return { subject, text: lines, html };
}

export function normalizeLocale(raw?: string | null): Locale {
  return raw === "es" ? "es" : "en";
}
