"use client";

import React, { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

type Theme = {
  headerBg?: string;
  headerText?: string;
  bubbleUser?: string;
  bubbleBot?: string;
  sendBg?: string;
  sendText?: string;
};

export function AliigoChatWidget({
  token,
  brand = "Aliigo",
  businessSlug,
  theme = {},
}: {
  token?: string;
  brand?: string;
  businessSlug?: string;
  theme?: Theme;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [disabled, setDisabled] = useState<null | "domain" | "token">(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const th = {
    headerBg: theme.headerBg ?? "bg-gray-900",
    headerText: theme.headerText ?? "text-white",
    bubbleUser: theme.bubbleUser ?? "bg-blue-600 text-white",
    bubbleBot: theme.bubbleBot ?? "bg-gray-100 text-gray-900",
    sendBg: theme.sendBg ?? "bg-blue-600",
    sendText: theme.sendText ?? "text-white",
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [msgs, open]);

  // If you want the widget to not appear at all when token is missing,
  // flip this on. For now it matches your current behavior (preview UI).
  // useEffect(() => {
  //   if (!token) setDisabled("token");
  // }, [token]);

  function getParentHost(): string {
    try {
      return new URL(document.referrer).host.replace(/:\d+$/, "").toLowerCase();
    } catch {
      return "";
    }
  }

  async function send(content: string) {
    if (!content.trim()) return;

    if (!token) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Para activar el chat, genera un token en Ajustes → Widget y vuelve a intentarlo.",
        },
      ]);
      return;
    }

    const parentHost = getParentHost();

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
          host: parentHost, // ✅ this is the key
        }),
      });

      const raw: unknown = await res.json().catch(() => ({}));

      const payload =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

      const errText = typeof payload.error === "string" ? payload.error : "";

      if (!res.ok) {
        // ✅ Hide widget entirely if host is not allowlisted
        if (res.status === 403 && /domain not allowed/i.test(errText)) {
          setDisabled("domain");
          setOpen(false);
          setBusy(false);
          return;
        }

        setMsgs((m) => [
          ...m,
          { role: "assistant", content: errText || "Error. Intenta de nuevo." },
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
        {
          role: "assistant",
          content: reply || "Gracias. Te respondemos enseguida.",
        },
      ]);
      setBusy(false);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "Error de red. Intenta de nuevo." },
      ]);
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

  // ✅ If domain is blocked, don’t render anything (no button, no panel)
  if (disabled === "domain") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="w-80 h-96 bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div
            className={`px-4 py-3 border-b text-sm font-medium flex items-center justify-between ${th.headerBg} ${th.headerText}`}
          >
            <span>
              {brand} — Chat{businessSlug ? ` (${businessSlug})` : ""}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="opacity-80 hover:opacity-100"
              type="button"
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 p-3 space-y-2 overflow-y-auto">
            {msgs.length === 0 && (
              <div className="text-xs text-gray-500">
                {token
                  ? "Pregúntanos lo que quieras. Te respondemos al momento."
                  : "Este es un preview. Genera un token en Ajustes → Widget para activar el chat."}
              </div>
            )}

            {msgs.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-xl text-sm ${
                    m.role === "user" ? th.bubbleUser : th.bubbleBot
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <form className="p-2 border-t flex gap-2" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                token
                  ? "Escribe tu mensaje…"
                  : "Genera un token para activar el chat"
              }
              onKeyDown={handleKeyDown}
              disabled={busy || !token}
            />
            <button
              type="submit"
              disabled={busy || !token}
              className={`px-3 py-2 text-sm rounded-lg disabled:opacity-50 ${th.sendBg} ${th.sendText}`}
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`rounded-full shadow-xl px-4 py-3 text-sm ${th.sendBg} ${th.sendText}`}
          type="button"
        >
          Chat with us
        </button>
      )}
    </div>
  );
}
