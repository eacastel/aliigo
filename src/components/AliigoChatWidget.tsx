// src/components/AliigoChatWidget.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

type Theme = {
  headerBg?: string;    // "bgHex textHex" preferred
  headerText?: string;  // fallback only
  bubbleUser?: string;  // "bgHex textHex" preferred
  bubbleBot?: string;   // "bgHex textHex" preferred
  sendBg?: string;      // "bgHex textHex" preferred
  sendText?: string;    // fallback only
};

type UILang = "en" | "es";

function uiLang(locale?: string): UILang {
  const l = (locale || "").toLowerCase();
  return l.startsWith("es") ? "es" : "en";
}

const UI = {
  en: {
    button: (brand: string) => `Ask ${brand}`,
    header: (brand: string, slug?: string) =>
      `${brand} Assistant${slug ? ` (${slug})` : ""}`,
    welcome: "Ask a question and we’ll help right away.",
    placeholder: "Type your question…",
    send: "Send",
    missingToken:
      "To activate the assistant, generate a token in Settings → Widget and try again.",
    err: "Error. Please try again.",
    net: "Network error. Please try again.",
    fallback: "Thanks. We’ll help right away.",
    previewHint:
      "This is a preview. Generate a token in Settings → Widget to enable the assistant.",
  },
  es: {
    button: (brand: string) => `Pregunta a ${brand}`,
    header: (brand: string, slug?: string) =>
      `Asistente de ${brand}${slug ? ` (${slug})` : ""}`,
    welcome: "Haz tu consulta y te ayudamos al momento.",
    placeholder: "Escribe tu consulta…",
    send: "Enviar",
    missingToken:
      "Para activar el asistente, genera un token en Ajustes → Widget y vuelve a intentarlo.",
    err: "Error. Inténtalo de nuevo.",
    net: "Error de red. Inténtalo de nuevo.",
    fallback: "Gracias. Te ayudamos al momento.",
    previewHint:
      "Esto es una vista previa. Genera un token en Ajustes → Widget para activar el asistente.",
  },
} as const;

type Channel = "web" | "whatsapp" | "sms" | "email" | "telegram";

const isHex = (v?: string) =>
  typeof v === "string" && /^#([0-9a-fA-F]{3}){1,2}$/.test(v.trim());

function twoHex(v?: string): { bg?: string; text?: string } {
  const s = (v || "").trim();
  if (!s) return {};
  const m = s.match(/#([0-9a-fA-F]{3}){1,2}/g) || [];
  return { bg: m[0], text: m[1] };
}

// Pair-first resolver:
// - If value contains two hexes: use both.
// - If contains one hex: use it as bg, pull text from fallback if hex.
// - If nothing usable: use defaults.
function resolvePair(
  pairValue: string | undefined,
  fallbackTextValue: string | undefined,
  defaults: { bg: string; text: string }
) {
  const p = twoHex(pairValue);
  const bg =
    p.bg ||
    (isHex(pairValue) ? pairValue!.trim() : "") ||
    defaults.bg;

  const text =
    p.text ||
    (isHex(fallbackTextValue) ? fallbackTextValue!.trim() : "") ||
    defaults.text;

  return { bg, text };
}

export function AliigoChatWidget({
  token,
  brand = "Aliigo",
  businessSlug,
  theme = {},
  locale,
  parentHost,
  channel = "web",
  preview = false,
}: {
  token?: string;
  brand?: string;
  businessSlug?: string;
  theme?: Theme;
  locale?: string;
  parentHost?: string;
  channel?: Channel;
  preview?: boolean;
}) {
  const lang = uiLang(locale);
  const t = UI[lang];

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [disabled, setDisabled] = useState<null | "domain">(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Defaults (hex only)
  const header = resolvePair(theme.headerBg, theme.headerText, {
    bg: "#111827",
    text: "#ffffff",
  });

  const userBubble = resolvePair(theme.bubbleUser, theme.bubbleUser, {
    bg: "#2563eb",
    text: "#ffffff",
  });

  const botBubble = resolvePair(theme.bubbleBot, theme.bubbleBot, {
    bg: "#f3f4f6",
    text: "#111827",
  });

  const sendBtn = resolvePair(theme.sendBg, theme.sendText, {
    bg: "#2563eb",
    text: "#ffffff",
  });

  const wrapStyle: React.CSSProperties = preview
    ? { position: "absolute", bottom: 16, right: 16, zIndex: 50 }
    : { position: "fixed", bottom: 24, right: 24, zIndex: 50 };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs, open]);

  useEffect(() => {
    const msg = open
      ? { type: "ALIIGO_WIDGET_SIZE", w: 360, h: 420, radius: "12px" }
      : { type: "ALIIGO_WIDGET_SIZE", w: 180, h: 56, radius: "9999px" };

    try {
      window.parent?.postMessage(msg, "*");
    } catch {
      // noop
    }
  }, [open]);

  async function send(content: string) {
    if (!content.trim()) return;

    if (!token) {
      setMsgs((m) => [...m, { role: "assistant", content: t.missingToken }]);
      return;
    }

    const host =
      (parentHost || "").trim().toLowerCase().replace(/:\d+$/, "") ||
      (typeof window !== "undefined"
        ? window.location.host.replace(/:\d+$/, "").toLowerCase()
        : "") ||
      (() => {
        try {
          return new URL(document.referrer || "")
            .host.replace(/:\d+$/, "")
            .toLowerCase();
        } catch {
          return "";
        }
      })();

    setBusy(true);
    setMsgs((m) => [...m, { role: "user", content }]);

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          conversationId,
          message: content,
          host,
          locale,
          channel,
        }),
      });

      const raw: unknown = await res.json().catch(() => ({}));
      const payload =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      const errText = typeof payload.error === "string" ? payload.error : "";

      if (!res.ok) {
        if (res.status === 403 && /domain not allowed/i.test(errText)) {
          setDisabled("domain");
          setOpen(false);
          setBusy(false);
          return;
        }
        setMsgs((m) => [...m, { role: "assistant", content: errText || t.err }]);
        setBusy(false);
        return;
      }

      const nextConversationId =
        typeof payload.conversationId === "string"
          ? payload.conversationId
          : null;

      const reply = typeof payload.reply === "string" ? payload.reply : "";
      if (nextConversationId) setConversationId(nextConversationId);

      setMsgs((m) => [
        ...m,
        { role: "assistant", content: reply || t.fallback },
      ]);
      setBusy(false);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: t.net }]);
      setBusy(false);
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const v = inputRef.current?.value || "";
    if (inputRef.current) inputRef.current.value = "";
    void send(v);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  if (disabled === "domain") return null;

  return (
    <div style={wrapStyle}>
      {/* Scoped CSS reset + component styles (no Tailwind dependency) */}
      <style>{`
  .aliigo-root, .aliigo-root * {
    box-sizing: border-box;
    font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  }

  .aliigo-card {
    width: 320px;
    height: 384px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,.25);
    display:flex;
    flex-direction:column;
  }

  .aliigo-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0,0,0,.06);
    display:flex;
    align-items:center;
    justify-content:space-between;
    font-size: 14px;
    font-weight: 600;
  }

  .aliigo-body {
    flex:1;
    padding: 12px;
    overflow-y: auto;
  }

  .aliigo-hint { font-size: 12px; color:#6b7280; }

  .aliigo-msgwrap { margin-top: 8px; }

  .aliigo-msg {
    display:inline-block;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 14px;
    max-width: 85%;
    word-break: break-word;
  }

  .aliigo-form {
    padding: 10px;
    border-top: 1px solid rgba(0,0,0,.08);
    display:flex;
    gap: 8px;
    align-items: center;
    background: #fff;
  }

  /* IMPORTANT: explicitly set color + caret + appearance */
  .aliigo-input {
    flex:1;
    height: 38px;
    border:1px solid #e5e7eb;
    border-radius: 10px;
    padding: 0 12px;
    font-size: 14px;
    outline: none;
    background: #fff;
    color: #111827;
    caret-color: #111827;
    -webkit-appearance: none;
    appearance: none;
  }

  .aliigo-input::placeholder {
    color: #9ca3af;
    opacity: 1;
  }

  .aliigo-input:focus {
    border-color: rgba(59,130,246,.6);
    box-shadow: 0 0 0 3px rgba(59,130,246,.25);
  }

  .aliigo-btn {
    height: 38px;
    border:0;
    border-radius: 10px;
    padding: 0 14px;
    font-size: 14px;
    font-weight: 600;
    cursor:pointer;
  }

  .aliigo-btn:disabled { opacity: .55; cursor: not-allowed; }

  .aliigo-pill {
    border-radius: 9999px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 700;
    border: 0;
    cursor:pointer;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,.18);
  }
`}</style>


      <div className="aliigo-root">
        {open ? (
          <div className="aliigo-card">
            <div
              className="aliigo-header"
              style={{ backgroundColor: header.bg, color: header.text }}
            >
              <span>{t.header(brand, businessSlug)}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: header.text,
                  fontSize: 18,
                  lineHeight: "18px",
                  cursor: "pointer",
                  opacity: 0.9,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div ref={scrollRef} className="aliigo-body">
              {msgs.length === 0 && (
                <div className="aliigo-hint">
                  {token ? t.welcome : t.previewHint}
                </div>
              )}

              {msgs.map((m, i) => (
                <div
                  key={i}
                  className="aliigo-msgwrap"
                  style={{ textAlign: m.role === "user" ? "right" : "left" }}
                >
                  <div
                    className="aliigo-msg"
                    style={{
                      backgroundColor:
                        m.role === "user" ? userBubble.bg : botBubble.bg,
                      color: m.role === "user" ? userBubble.text : botBubble.text,
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <form className="aliigo-form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                className="aliigo-input"
                placeholder={token ? t.placeholder : t.missingToken}
                onKeyDown={handleKeyDown}
                disabled={busy || !token}
              />
              <button
                type="submit"
                className="aliigo-btn"
                disabled={busy || !token}
                style={{ backgroundColor: sendBtn.bg, color: sendBtn.text }}
              >
                {t.send}
              </button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            className="aliigo-pill"
            onClick={() => setOpen(true)}
            style={{ backgroundColor: sendBtn.bg, color: sendBtn.text }}
          >
            {t.button(brand)}
          </button>
        )}
      </div>
    </div>
  );
}
