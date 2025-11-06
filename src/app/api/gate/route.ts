// src/app/api/gate/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()
  if (password && password === process.env.SITE_GATE_PASSWORD) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('aliigo_gate', 'ok', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60*60*8 })
    return res
  }
  return NextResponse.json({ ok: false }, { status: 401 })
}
