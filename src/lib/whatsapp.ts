import crypto from "crypto";

export type WhatsAppInboundTextMessage = {
  messageId: string;
  phoneNumberId: string;
  fromWaId: string;
  profileName: string | null;
  text: string;
  timestamp: string | null;
};

type PhoneNumberMap = Record<string, string>;

export function verifyWhatsAppSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string | null | undefined;
}): boolean {
  const { rawBody, signatureHeader, appSecret } = params;
  if (!appSecret) return true;
  if (!signatureHeader) return false;
  const [algo, hash] = signatureHeader.split("=");
  if (algo !== "sha256" || !hash) return false;

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function extractInboundTextMessages(payload: unknown): WhatsAppInboundTextMessage[] {
  const body = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          metadata?: { phone_number_id?: string };
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
          messages?: Array<{
            id?: string;
            from?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
          }>;
        };
      }>;
    }>;
  };

  const out: WhatsAppInboundTextMessage[] = [];
  const entries = Array.isArray(body?.entry) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value;
      const phoneNumberId = value?.metadata?.phone_number_id || "";
      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      const contact0 = contacts[0];
      const profileName = contact0?.profile?.name?.trim() || null;
      const contactWaId = contact0?.wa_id?.trim() || "";

      const messages = Array.isArray(value?.messages) ? value.messages : [];
      for (const msg of messages) {
        if (msg?.type !== "text") continue;
        const text = msg?.text?.body?.trim() || "";
        const fromWaId = (msg?.from || contactWaId || "").trim();
        const messageId = (msg?.id || "").trim();
        if (!text || !fromWaId || !phoneNumberId || !messageId) continue;
        out.push({
          messageId,
          phoneNumberId: phoneNumberId.trim(),
          fromWaId,
          profileName,
          text,
          timestamp: msg?.timestamp || null,
        });
      }
    }
  }
  return out;
}

function parsePhoneNumberMap(raw: string | null | undefined): PhoneNumberMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const map: PhoneNumberMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k !== "string" || typeof v !== "string") continue;
      const key = k.trim();
      const val = v.trim();
      if (key && val) map[key] = val;
    }
    return map;
  } catch {
    return {};
  }
}

export function resolveBusinessIdForPhoneNumber(phoneNumberId: string): string | null {
  const map = parsePhoneNumberMap(process.env.WHATSAPP_PHONE_NUMBER_MAP);
  if (map[phoneNumberId]) return map[phoneNumberId];

  const fallback = process.env.WHATSAPP_DEFAULT_BUSINESS_ID?.trim();
  if (fallback) return fallback;
  return null;
}

export async function sendWhatsAppText(params: {
  phoneNumberId: string;
  to: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "Missing META_WHATSAPP_ACCESS_TOKEN" };

  const version = process.env.META_GRAPH_API_VERSION || "v21.0";
  const url = `https://graph.facebook.com/${version}/${params.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.to,
        type: "text",
        text: { body: params.text },
      }),
      cache: "no-store",
    });

    if (res.ok) return { ok: true };
    const raw = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      error: raw || `Graph API request failed (${res.status})`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown WhatsApp send error",
    };
  }
}

