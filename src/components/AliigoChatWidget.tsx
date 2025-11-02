'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Msg = { role: 'user'|'assistant'; content: string };

type Theme = {
  headerBg?: string;      // bg color classes
  headerText?: string;    // text color classes
  bubbleUser?: string;    // classes for user bubble
  bubbleBot?: string;     // classes for bot bubble
  inputBg?: string;       // input background
  sendBg?: string;        // send button bg
  sendText?: string;      // send button text
  border?: string;        // border color classes
};

const DEFAULT_THEME: Required<Theme> = {
  headerBg:  'bg-blue-600',
  headerText:'text-white',
  bubbleUser:'bg-blue-600 text-white',
  bubbleBot: 'bg-gray-100 text-gray-900',
  inputBg:   'bg-white',
  sendBg:    'bg-blue-600',
  sendText:  'text-white',
  border:    'border-gray-200',
};

export function AliigoChatWidget({
  businessSlug,
  brand = 'Horchata Labs',
  theme: themeProp = {},
}: {
  businessSlug: string;
  brand?: string;
  theme?: Theme;
}) {
  const theme = useMemo(() => ({ ...DEFAULT_THEME, ...themeProp }), [themeProp]);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // auto-scroll to bottom on new messages/open
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  async function send(content: string) {
    const text = content.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setMsgs(m => [...m, { role: 'user', content: text }]);

    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessSlug, conversationId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Error. Inténtalo de nuevo.';
        setMsgs(m => [...m, { role: 'assistant', content: msg }]);
        setError(res.status === 429 ? 'Has enviado demasiados mensajes. Espera un momento.' : msg);
      } else {
        setConversationId(data.conversationId);
        setMsgs(m => [...m, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      setError('Fallo de red. Revisa tu conexión.');
      setMsgs(m => [...m, { role: 'assistant', content: 'Fallo de red. Inténtalo más tarde.' }]);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = inputRef.current?.value ?? '';
    if (inputRef.current) inputRef.current.value = '';
    send(v);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const v = (e.currentTarget.value ?? '');
      e.currentTarget.value = '';
      send(v);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className={`w-80 h-96 bg-white shadow-2xl rounded-2xl border ${theme.border} flex flex-col overflow-hidden`}>
          {/* Header */}
          <div className={`px-4 py-3 border-b ${theme.headerBg} ${theme.headerText}`}>
            <div className="text-sm font-medium flex items-center justify-between">
              <span>{brand} — Chat</span>
              <button
                onClick={() => setOpen(false)}
                className={`${theme.headerText} opacity-80 hover:opacity-100`}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollerRef} className="flex-1 p-3 space-y-2 overflow-y-auto">
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                {error}
              </div>
            )}
            {msgs.length === 0 && !error && (
              <div className="text-xs text-gray-500">
                Escribe tu pregunta. Pulsa <kbd>Enter</kbd> para enviar. Usa <kbd>Shift+Enter</kbd> para saltos de línea.
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block px-3 py-2 rounded-xl text-sm ${m.role==='user'?theme.bubbleUser:theme.bubbleBot}`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className={`p-2 border-t ${theme.border} flex gap-2`}>
            <textarea
              ref={inputRef}
              rows={1}
              onKeyDown={onKeyDown}
              placeholder="Escribe un mensaje…"
              className={`flex-1 resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputBg} border ${theme.border}`}
              disabled={busy}
            />
            <button
              disabled={busy}
              className={`px-3 py-2 text-sm rounded-lg disabled:opacity-50 ${theme.sendBg} ${theme.sendText}`}
              type="submit"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white rounded-full shadow-xl px-4 py-3 text-sm hover:brightness-110"
        >
          Chat with us
        </button>
      )}
    </div>
  );
}
