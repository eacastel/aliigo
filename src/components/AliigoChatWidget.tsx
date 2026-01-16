// src/components/AliigoChatWidget.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

type Theme = {
  headerBg?: string; // "bgHex textHex" preferred
  headerText?: string; // fallback only
  bubbleUser?: string; // "bgHex textHex" preferred
  bubbleBot?: string; // "bgHex textHex" preferred
  sendBg?: string; // "bgHex textHex" preferred
  sendText?: string; // fallback only
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
      `${brand} ${slug ? ` (${slug})` : ""}`,
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
      `${brand}${slug ? ` (${slug})` : ""}`,
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
  const bg = p.bg || (isHex(pairValue) ? pairValue!.trim() : "") || defaults.bg;

  const text =
    p.text ||
    (isHex(fallbackTextValue) ? fallbackTextValue!.trim() : "") ||
    defaults.text;

  return { bg, text };
}

type Skin = "classic" | "dark";

export function AliigoChatWidget({
  token,
  brand = "Aliigo",
  businessSlug,
  theme = {},
  locale,
  parentHost,
  channel = "web",
  preview = false,
  alwaysOpen = false,
  skin = "classic",
  height,
  variant = "floating",
}: {
  token?: string;
  brand?: string;
  businessSlug?: string;
  theme?: Theme;
  locale?: string;
  parentHost?: string;
  channel?: Channel;
  preview?: boolean;
  alwaysOpen?: boolean;
  skin?: Skin;
  height?: number;
  variant?: "floating" | "inline";
}) {
  const lang = uiLang(locale);
  const t = UI[lang];

  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [disabled, setDisabled] = useState<null | "domain">(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null); // scroll container
  const bottomRef = useRef<HTMLDivElement>(null); // anchor at end

  const inline = variant === "inline";
  const isOpen = inline || alwaysOpen || open;

  const minH = inline ? 260 : 320;
  const defaultH = preview ? 360 : 420;
  const cardH = Math.max(minH, Math.min(height ?? defaultH, 640));

  function renderText(s: string) {
    // Minimal formatting:
    // - converts **bold** to <strong>
    // - preserves newlines
    const lines = (s || "").split("\n");
    const out: React.ReactNode[] = [];

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const segs = line.split(/\*\*(.*?)\*\*/g);

      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        if (!seg) continue;
        if (i % 2 === 1) out.push(<strong key={`${li}-${i}`}>{seg}</strong>);
        else out.push(<span key={`${li}-${i}`}>{seg}</span>);
      }

      if (li < lines.length - 1) out.push(<br key={`br-${li}`} />);
    }

    return out;
  }

  useEffect(() => {
    if (alwaysOpen) setOpen(true);
  }, [alwaysOpen]);

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



  const wrapStyle: React.CSSProperties = inline
    ? { position: "relative", width: "100%" }
    : preview
    ? {
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        padding: 16,
      }
    : inIframe
    ? { position: "relative", width: "100%" }
    : { position: "fixed", bottom: 24, right: 24, zIndex: 50 };



  useEffect(() => {
    const el = scrollRef.current?.querySelector(".aliigo-messages") as HTMLDivElement | null;
    if (!el) return;

    const id = window.requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });

    return () => window.cancelAnimationFrame(id);
  }, [msgs.length, isOpen]);

  useEffect(() => {
    // Inline version is not inside an iframe, no sizing messages needed
    if (inline) return;

    const msg = isOpen
      ? { type: "ALIIGO_WIDGET_SIZE", w: 360, h: cardH, radius: "12px" }
      : { type: "ALIIGO_WIDGET_SIZE", w: 240, h: 56, radius: "9999px" }

    try {
      window.parent?.postMessage(msg, "*");
    } catch {}
  }, [inline, isOpen, cardH]);

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
          return new URL(document.referrer || "").host
            .replace(/:\d+$/, "")
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
        setMsgs((m) => [
          ...m,
          { role: "assistant", content: errText || t.err },
        ]);
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
      e.stopPropagation();
      handleSubmit();
    }
  }

  if (disabled === "domain") return null;

  type CSSVars = React.CSSProperties & {
    ["--aliigo-accent"]?: string;
  };

  const accent = sendBtn.bg || "#84c9ad";

  const rootStyle: CSSVars =
    skin === "dark" ? { ["--aliigo-accent"]: accent } : {};

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
  height: 330px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,.25);
  display: flex;
  flex-direction: column;
}

/* header (hidden in inline via JSX, so keep normal) */
.aliigo-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0,0,0,.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
}

/* IMPORTANT: body is a wrapper, NOT the scroller */
.aliigo-body {
  flex: 1;
  min-height: 0;     /* critical for nested scrolling */
  padding: 12px;
  overflow: hidden;  /* do not scroll here */
  display: flex;
}

/* THIS is the scroller */
.aliigo-messages {
  flex: 1;
  min-height: 0;     /* critical */
  overflow-y: auto;
  padding-right: 6px;
}

/* Hide scrollbar until hover (WebKit) */
.aliigo-messages::-webkit-scrollbar { width: 10px; }
.aliigo-messages::-webkit-scrollbar-track { background: transparent; }
.aliigo-messages::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 999px;
}
.aliigo-card:hover .aliigo-messages::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.18);
}

/* Hide scrollbar until hover (Firefox) */
.aliigo-messages { scrollbar-width: none; }
.aliigo-card:hover .aliigo-messages {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.18) transparent;
}

.aliigo-hint { font-size: 12px; color: #6b7280; }

.aliigo-msgwrap { margin-top: 8px; }

.aliigo-msg {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  max-width: 85%;
  word-break: break-word;
}

.aliigo-form {
  padding: 10px;
  border-top: 1px solid rgba(0,0,0,.08);
  display: flex;
  gap: 8px;
  align-items: center;
  background: #fff;
  flex: 0 0 auto; /* keep it pinned at bottom */
}

.aliigo-input {
  flex: 1;
  height: 38px;
  border: 1px solid #e5e7eb;
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

.aliigo-input::placeholder { color: #9ca3af; opacity: 1; }

.aliigo-input:focus {
  border-color: rgba(59,130,246,.6);
  box-shadow: 0 0 0 3px rgba(59,130,246,.25);
}

.aliigo-btn {
  height: 38px;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.aliigo-btn:disabled { opacity: .55; cursor: not-allowed; }

.aliigo-pill {
  border-radius: 9999px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  border: 0;
  cursor: pointer;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,.18);
  white-space: nowrap;
}

/* ===== Dark skin overrides ===== */
.aliigo-skin-dark.aliigo-card {
  width: 360px;
  background: rgba(9, 9, 11, 0.72);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 18px;
  box-shadow: 0 25px 60px rgba(0,0,0,.45);
  backdrop-filter: blur(10px);
}

/* Base frame: REQUIRED for classic + dark so body can flex and input pins bottom */
.aliigo-frame {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Frame is the internal flex column container */
.aliigo-frame-dark { 
  margin: 4px;
  border-radius: 14px;
  border: 0px solid rgba(255,255,255,0.10);
  background: rgba(9, 9, 11, 0.55);
  overflow: hidden;
}

.aliigo-skin-dark .aliigo-header {
  border-bottom: 1px solid rgba(255,255,255,0.10);
  color: rgba(244,244,245,1);
  background: transparent;
}

.aliigo-skin-dark .aliigo-hint { color: rgba(161,161,170,1); }

.aliigo-skin-dark .aliigo-msg-bot {
  background: rgba(24,24,27,1);
  color: rgba(244,244,245,1);
  border: 1px solid rgba(255,255,255,0.06);
  border-top-left-radius: 6px;
}

.aliigo-skin-dark .aliigo-msg-user {
  background: var(--aliigo-accent, #84c9ad);
  color: #0a0a0a;
  border-top-right-radius: 6px;
}

.aliigo-skin-dark .aliigo-form {
  border-top: 1px solid rgba(255,255,255,0.10);
  background: rgba(9, 9, 11, 0.35);
}

.aliigo-skin-dark .aliigo-input {
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(24,24,27,0.65);
  color: rgba(244,244,245,1);
  caret-color: rgba(244,244,245,1);
}

.aliigo-skin-dark .aliigo-input::placeholder { color: rgba(161,161,170,1); }

.aliigo-skin-dark .aliigo-btn {
  background: var(--aliigo-accent, #84c9ad);
  color: #0a0a0a;
  box-shadow: 0 0 18px rgba(132,201,173,0.18);
}

/* ===== Inline variant: remove widget chrome but keep layout ===== */
.aliigo-inline.aliigo-card {
  background: transparent;
  border: 0;
  box-shadow: none;
  backdrop-filter: none;
  border-radius: 0;
  width: 100%;
}

.aliigo-inline .aliigo-body { padding: 0; }
.aliigo-inline .aliigo-messages { padding-right: 0; }
.aliigo-inline .aliigo-form {
  padding: 0;
  margin-top: 12px;
  border-top: 0;
  background: transparent;
}

`}</style>

      <div className="aliigo-root" style={rootStyle}>
        {isOpen ? (
          <div
            className={`aliigo-card ${inline ? "aliigo-inline" : ""} ${
              skin === "dark" ? "aliigo-skin-dark" : "aliigo-skin-classic"
            }`}
            style={{
              height: inline ? undefined : cardH, 
              width: inline ? "100%" : undefined, 
            }}
          >
            <div className={`aliigo-frame ${skin === "dark" ? "aliigo-frame-dark" : ""}`}>
              {!inline && (
                <div
                  className="aliigo-header"
                  style={
                    skin === "dark"
                      ? { backgroundColor: "transparent", color: "#fff" }
                      : { backgroundColor: header.bg, color: header.text }
                  }
                >
                  <span>{t.header(brand, businessSlug)}</span>

                  {!alwaysOpen && (
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      style={{
                        background: "transparent",
                        border: 0,
                        color:
                          skin === "dark"
                            ? "rgba(244,244,245,0.9)"
                            : header.text,
                        fontSize: 18,
                        lineHeight: "18px",
                        cursor: "pointer",
                        opacity: 0.9,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              <div ref={scrollRef} className="aliigo-body">
                <div className="aliigo-messages">
                  {msgs.length === 0 && (
                    <div
                      className="aliigo-msgwrap"
                      style={{ textAlign: "left" }}
                    >
                      <div
                        className={
                          skin === "dark"
                            ? "aliigo-msg aliigo-msg-bot"
                            : "aliigo-msg"
                        }
                        style={
                          skin === "dark"
                            ? undefined
                            : {
                                backgroundColor: botBubble.bg,
                                color: botBubble.text,
                              }
                        }
                      >
                        {token ? t.welcome : t.previewHint}
                      </div>
                    </div>
                  )}

                  {msgs.map((m, i) => (
                    <div
                      key={i}
                      className="aliigo-msgwrap"
                      style={{
                        textAlign: m.role === "user" ? "right" : "left",
                      }}
                    >
                      <div
                        className={
                          skin === "dark"
                            ? `aliigo-msg ${
                                m.role === "user"
                                  ? "aliigo-msg-user"
                                  : "aliigo-msg-bot"
                              }`
                            : "aliigo-msg"
                        }
                        style={
                          skin === "dark"
                            ? undefined
                            : {
                                backgroundColor:
                                  m.role === "user"
                                    ? userBubble.bg
                                    : botBubble.bg,
                                color:
                                  m.role === "user"
                                    ? userBubble.text
                                    : botBubble.text,
                              }
                        }
                      >
                        {renderText(m.content)}
                      </div>
                    </div>
                  ))}

                  <div ref={bottomRef} />
                </div>
              </div>

              <form
                className="aliigo-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // ✅ prevents page jump
                  handleSubmit();
                }}
              >
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
                  style={
                    skin === "dark"
                      ? undefined
                      : { backgroundColor: sendBtn.bg, color: sendBtn.text }
                  }
                >
                  {t.send}
                </button>
              </form>
            </div>
          </div>
        ) : inline ? null : (
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
