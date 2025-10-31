'use client';
import React, { useEffect, useRef, useState } from 'react';


type Msg = { role: 'user'|'assistant'; content: string };


export function AliigoChatWidget({ businessSlug, brand = 'Horchata Labs' }: { businessSlug: string; brand?: string; }) {
const [open, setOpen] = useState(false);
const [busy, setBusy] = useState(false);
const [conversationId, setConversationId] = useState<string | null>(null);
const [msgs, setMsgs] = useState<Msg[]>([]);
const inputRef = useRef<HTMLInputElement>(null);


async function send(content: string) {
if (!content.trim()) return;
setBusy(true);
setMsgs(m => [...m, { role: 'user', content }]);


const res = await fetch('/api/conversation', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ businessSlug, conversationId, message: content })
});
const data = await res.json();
if (!res.ok) {
setMsgs(m => [...m, { role: 'assistant', content: data.error || 'Error. Please try again.' }]);
} else {
setConversationId(data.conversationId);
setMsgs(m => [...m, { role: 'assistant', content: data.reply }]);
}
setBusy(false);
}


return (
<div className="fixed bottom-6 right-6 z-50">
{open && (
<div className="w-80 h-96 bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
<div className="px-4 py-3 border-b text-sm font-medium flex items-center justify-between">
<span>{brand} — Chat</span>
<button onClick={() => setOpen(false)} className="text-gray-500 hover:text-black">×</button>
</div>
<div className="flex-1 p-3 space-y-2 overflow-y-auto">
{msgs.length === 0 && (
<div className="text-xs text-gray-500">Ask us anything. A smart assistant will reply instantly.</div>
)}
{msgs.map((m, i) => (
<div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
<div className={`inline-block px-3 py-2 rounded-xl text-sm ${m.role==='user'?'bg-blue-600 text-white':'bg-gray-100 text-gray-900'}`}>{m.content}</div>
</div>
))}
</div>
<form
className="p-2 border-t flex gap-2"
onSubmit={e => { e.preventDefault(); const v = inputRef.current?.value || ''; inputRef.current!.value = ''; send(v); }}
>
<input ref={inputRef} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type a message…" disabled={busy} />
<button disabled={busy} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">Send</button>
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
