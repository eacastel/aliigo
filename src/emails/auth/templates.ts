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
  const logoUrl = "https://aliigo.com/aliigo-logo-color.png";
  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111; background:#ffffff;">
    <div style="max-width:560px; margin:0 auto; padding:24px;">
      <div style="margin-bottom:16px;">
        <img src="${logoUrl}" alt="${strings.brand}" width="120" height="32" style="display:block;" />
      </div>
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
      <a href="${input.confirmUrl}" style="display:inline-block; padding:10px 16px; background:#84C9AD; color:#0b0b0b; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">
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

function firstName(fullName?: string | null) {
  if (!fullName) return null;
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || null;
}

export function buildWelcomeEmail(opts: {
  email: string;
  fullName?: string | null;
  locale: Locale;
  dashboardUrl?: string | null;
}) {
  const name = firstName(opts.fullName);

  if (opts.locale === "es") {
    const subject = "Bienvenido a Aliigo — encantado de tenerte aquí";
    const intro = name ? `Hola ${name},` : "Hola,";
    const html = wrapHtml(
      `
      <h2 style="margin:0 0 8px;">Bienvenido a Aliigo</h2>
      <p style="margin:0 0 16px; color:#333; font-size:14px;">${intro}</p>
      <p style="margin:0 0 16px; color:#333; font-size:14px;">
        Soy Emilio, fundador de Aliigo. Gracias por unirte.
      </p>

      <p style="margin:0 0 16px; color:#333; font-size:14px;">
        Aliigo nació para que las organizaciones puedan contar con un asistente tipo concierge que realmente controlan, y que represente bien su forma de trabajar.
      </p>

      <p style="margin:0 0 16px; color:#333; font-size:14px;">
        Para empezar, te propongo los siguientes pasos:
      </p>

      <ol style="margin:0 0 16px; padding-left:18px; color:#333; font-size:14px;">
        <li>Instala el widget y empieza a atender consultas desde hoy.</li>
        <li>Añade tu dominio y branding, selecciona idioma y personaliza el widget.</li>
        <li>Ajusta el conocimiento y le comportamiento del asistente según los objetivos de tu empresa y el tipo de visitantes.</li>
      </ol>

      ${
        opts.dashboardUrl
          ? `<p style="margin:0 0 16px;">
              <a href="${opts.dashboardUrl}"
                  style="display:inline-block; padding:10px 16px; background:#84C9AD; color:#0b0b0b;
                        text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">
                Abrir panel
              </a>
            </p>`
          : ""
      }

      <p style="margin:0 0 16px; color:#333; font-size:14px;">
        Si tienes un par de minutos, responde a este correo y dime:
        <strong>¿qué te trajo a Aliigo y qué te gustaría que el asistente gestione primero?</strong>
        Leo y respondo todos los mensajes personalmente.
      </p>

      <p style="margin:0 0 4px; color:#333; font-size:14px;">Un abrazo,</p>
      <p style="margin:0; color:#333; font-size:14px;">Emilio</p>
      `,
      "es"
    );

    const text = [
      "Bienvenido a Aliigo",
      intro,
      "Soy Emilio, fundador y CEO de Aliigo — gracias por unirte.",
      "Aliigo nació para que las empresas tengan un asistente concierge que realmente controlan.",
      "Tres pasos rápidos para empezar:",
      "1) Instala el widget para atender visitantes desde hoy.",
      "2) Añade tu dominio y contenido para respuestas precisas.",
      "3) Invita a tu equipo si quieres buzón compartido y flujos de trabajo.",
      opts.dashboardUrl ? `Panel: ${opts.dashboardUrl}` : "",
      "Responde a este correo y dime: ¿Qué te trajo a Aliigo y qué quieres que gestione primero?",
      "Un abrazo,",
      "Emilio",
    ]
      .filter(Boolean)
      .join("\n");

    return { subject, html, text };
  }

  const subject = "Welcome to Aliigo — glad you’re here";
  const intro = name ? `Hi ${name},` : "Hi,";
  const html = wrapHtml(
    `
    <h2 style="margin:0 0 8px;">Welcome to Aliigo</h2>
    <p style="margin:0 0 16px; color:#333; font-size:14px;">${intro}</p>
    <p style="margin:0 0 16px; color:#333; font-size:14px;">
      I’m Emilio, founder & CEO of Aliigo — thanks for joining us.
    </p>
    <p style="margin:0 0 16px; color:#333; font-size:14px;">
      Aliigo was built to help businesses deploy a concierge-style assistant they actually control.
      Here are three fast wins to get value quickly:
    </p>
    <ol style="margin:0 0 16px; padding-left:18px; color:#333; font-size:14px;">
      <li>Install your widget so visitors can start conversations today.</li>
      <li>Add your domain + content so answers stay accurate.</li>
      <li>Invite your team if you want a shared inbox and workflows.</li>
    </ol>
    ${
      opts.dashboardUrl
        ? `<p style="margin:0 0 16px;"><a href="${opts.dashboardUrl}" style="display:inline-block; padding:10px 16px; background:#84C9AD; color:#0b0b0b; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">Open dashboard</a></p>`
        : ""
    }
    <p style="margin:0 0 16px; color:#333; font-size:14px;">
      If you have 2 minutes, hit reply and tell me:
      <strong>What brought you to Aliigo, and what do you want it to handle first?</strong>
      I read every reply.
    </p>
    <p style="margin:0 0 4px; color:#333; font-size:14px;">Cheers,</p>
    <p style="margin:0; color:#333; font-size:14px;">Emilio</p>
    `,
    "en"
  );

  const text = [
    "Welcome to Aliigo",
    intro,
    "I’m Emilio, founder & CEO of Aliigo — thanks for joining us.",
    "Aliigo was built to help businesses deploy a concierge-style assistant they actually control.",
    "Three fast wins to get value quickly:",
    "1) Install your widget so visitors can start conversations today.",
    "2) Add your domain + content so answers stay accurate.",
    "3) Invite your team if you want a shared inbox and workflows.",
    opts.dashboardUrl ? `Dashboard: ${opts.dashboardUrl}` : "",
    "Reply and tell me: What brought you to Aliigo, and what do you want it to handle first?",
    "Cheers,",
    "Emilio",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
