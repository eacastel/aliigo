'use client';
import React, { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user'|'assistant'; content: string };

type Theme = {
  headerBg?: string;
  headerText?: string;
  bubbleUser?: string;
  bubbleBot?: string;
  sendBg?: string;
  sendText?: string;
};

export function AliigoChatWidget({
  token,                         // 🔐 NEW: required for real requests
  brand = 'Aliigo',
  businessSlug,                  // optional, only for display if you want
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
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const th = {
    headerBg: theme.headerBg ?? 'bg-gray-900',
    headerText: theme.headerText ?? 'text-white',
    bubbleUser: theme.bubbleUser ?? 'bg-blue-600 text-white',
    bubbleBot: theme.bubbleBot ?? 'bg-gray-100 text-gray-900',
    sendBg: theme.sendBg ?? 'bg-blue-600',
    sendText: theme.sendText ?? 'text-white',
  };

  // Always scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [msgs, open]);

  async function send(content: string) {
    if (!content.trim()) return;

    // If there is no token, block send (dashboard preview without token)
    if (!token) {
      setMsgs((m) => [
        ...m,
        { role: 'assistant', content: '⚠️ Genera un token en Ajustes → Widget y vuelve a intentarlo.' },
      ]);
      return;
    }

    setBusy(true);
    setMsgs((m) => [...m, { role: 'user', content }]);

    const res = await fetch('/api/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 🔐 Only token (server derives businessId from token + domain)
      body: JSON.stringify({ token, conversationId, message: content }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsgs((m) => [...m, { role: 'assistant', content: data.error || 'Error. Intenta de nuevo.' }]);
      setBusy(false);
      return;
    }

    setConversationId(data.conversationId);
    setMsgs((m) => [...m, { role: 'assistant', content: data.reply }]);
    setBusy(false);
  }

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const v = inputRef.current?.value || '';
    if (inputRef.current) inputRef.current.value = '';
    void send(v);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="w-80 h-96 bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className={`px-4 py-3 border-b text-sm font-medium flex items-center justify-between ${th.headerBg} ${th.headerText}`}>
            <span>{brand} — Chat{businessSlug ? ` (${businessSlug})` : ''}</span>
            <button onClick={() => setOpen(false)} className="opacity-80 hover:opacity-100">×</button>
          </div>

          <div ref={scrollRef} className="flex-1 p-3 space-y-2 overflow-y-auto">
            {msgs.length === 0 && (
              <div className="text-xs text-gray-500">
                {token
                  ? 'Pregúntanos lo que quieras. Te respondemos al momento.'
                  : '⚠️ Este es un preview. Genera un token en Ajustes → Widget para activar el chat.'}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block px-3 py-2 rounded-xl text-sm ${m.role==='user' ? th.bubbleUser : th.bubbleBot}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <form className="p-2 border-t flex gap-2" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={token ? "Escribe tu mensaje…" : "Genera un token para activar el chat"}
              onKeyDown={handleKeyDown}
              disabled={busy || !token}
            />
            <button
              disabled={busy || !token}
              className={`px-3 py-2 text-sm rounded-lg disabled:opacity-50 ${th.sendBg} ${th.sendText}`}
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button onClick={() => setOpen(true)} className="bg-blue-600 text-white rounded-full shadow-xl px-4 py-3 text-sm">
          Chat with us
        </button>
      )}
    </div>
  );
}
