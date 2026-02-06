type Locale = "en" | "es";

export type LeadNotificationInput = {
  locale: Locale;
  businessName: string;
  conversationUrl: string;
  lead: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    consent?: boolean | null;
  };
  summaryLines: string[];
};

function wrap(content: string) {
  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111; background:#ffffff;">
    <div style="max-width:640px; margin:0 auto; padding:24px;">
      ${content}
      <p style="font-size:12px; color:#666; margin-top:24px;">Aliigo</p>
    </div>
  </div>
  `;
}

export function buildLeadNotification(input: LeadNotificationInput) {
  const isEs = input.locale === "es";
  const subject = isEs
    ? `Nuevo contacto desde el widget — ${input.businessName}`
    : `New widget lead — ${input.businessName}`;

  const title = isEs ? "Nuevo contacto" : "New lead";
  const consentLine = isEs
    ? "El usuario aceptó ser contactado para esta solicitud."
    : "The user consented to be contacted about this request.";

  const summaryTitle = isEs ? "Resumen de la conversación" : "Conversation summary";
  const openLabel = isEs ? "Ver conversación completa" : "View full conversation";

  const lines = input.summaryLines.map((l) => `<li style="margin:4px 0;">${l}</li>`).join("");

  const html = wrap(`
    <h2 style="margin:0 0 8px;">${title}</h2>
    <div style="font-size:14px; color:#333;">
      <div><strong>${isEs ? "Nombre" : "Name"}:</strong> ${input.lead.name ?? "-"}</div>
      <div><strong>Email:</strong> ${input.lead.email ?? "-"}</div>
      <div><strong>${isEs ? "Teléfono" : "Phone"}:</strong> ${input.lead.phone ?? "-"}</div>
    </div>
    <p style="margin:12px 0; font-size:13px; color:#555;">${consentLine}</p>
    <div style="margin-top:12px;">
      <div style="font-size:13px; font-weight:600; margin-bottom:6px;">${summaryTitle}</div>
      <ul style="margin:0; padding-left:18px; font-size:13px; color:#333;">${lines}</ul>
    </div>
    <p style="margin-top:16px;">
      <a href="${input.conversationUrl}" style="display:inline-block; padding:10px 16px; background:#84C9AD; color:#0b0b0b; text-decoration:none; border-radius:8px; font-size:13px; font-weight:600;">
        ${openLabel}
      </a>
    </p>
  `);

  const text = [
    title,
    `${isEs ? "Nombre" : "Name"}: ${input.lead.name ?? "-"}`,
    `Email: ${input.lead.email ?? "-"}`,
    `${isEs ? "Teléfono" : "Phone"}: ${input.lead.phone ?? "-"}`,
    consentLine,
    summaryTitle + ":",
    ...input.summaryLines,
    `${isEs ? "Ver conversación" : "View conversation"}: ${input.conversationUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export function normalizeLocale(raw?: string | null): Locale {
  return raw === "es" ? "es" : "en";
}
