// src/app/api/invite/send/route.ts  (protect with a secret header)
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { customAlphabet } from 'nanoid'

const nano = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)
const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  // simple auth
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_KEY) return NextResponse.json({ ok:false }, { status: 401 })
  const { email } = await req.json()

  const code = nano()
  const { error } = await supabase.from('invites').insert({ email, code, status:'sent', sent_at: new Date().toISOString() })
  if (error) return NextResponse.json({ ok:false }, { status: 500 })

  const inviteUrl = `https://aliigo.com/invite/${code}`
  await resend.emails.send({
    from: 'Aliigo <hello@aliigo.com>',
    to: email,
    subject: 'Your Aliigo invite code',
    html: `<p>Welcome to Aliigo.</p><p>Click to activate: <a href="${inviteUrl}">${inviteUrl}</a></p>`,
  })

  return NextResponse.json({ ok:true })
}
