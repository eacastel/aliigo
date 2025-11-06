// src/app/join/page.tsx
'use client'
import { useState } from 'react'

export default function JoinPage({ searchParams }: any) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const locked = searchParams?.locked === '1'

  async function submitWaitlist(e: React.FormEvent) {
    e.preventDefault()
    const r = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setMsg(r.ok ? 'Thanks — check your inbox.' : 'Something went wrong.')
  }

  async function enter(e: React.FormEvent) {
    e.preventDefault()
    const r = await fetch('/api/gate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (r.ok) location.href = '/'
    else setMsg('Incorrect password.')
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Aliigo — Early Access</h1>

      {locked && (
        <form onSubmit={enter} className="space-y-3 border rounded p-4">
          <p className="text-sm">Private preview. Enter team password to proceed.</p>
          <input className="w-full border rounded p-2" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} />
          <button className="w-full rounded p-2 border">Enter</button>
        </form>
      )}

      <form onSubmit={submitWaitlist} className="space-y-3 border rounded p-4">
        <p>Want an invite when we open? Join the waitlist:</p>
        <input className="w-full border rounded p-2" type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required />
        <button className="w-full rounded p-2 border">Join waitlist</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>

      <p className="text-xs text-gray-500">We’ll email an invite code when your spot is ready.</p>
    </main>
  )
}
