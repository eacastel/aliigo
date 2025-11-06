// src/app/api/waitlist/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ ok:false }, { status: 400 })

  const ip = (req as any).ip ?? '' // Vercel forwards ip in headers; can also read from req.headers.get('x-forwarded-for')
  const { error } = await supabase.from('waitlist').upsert({ email, ip }, { onConflict: 'email' })
  if (error) return NextResponse.json({ ok:false }, { status: 500 })

  await resend.emails.send({
    from: 'Aliigo <hello@aliigo.com>',
    to: email,
    subject: 'You’re on the Aliigo waitlist',
    html: `<p>Thanks for your interest. We’ll send your invite code as soon as a slot opens.</p>`,
  })

  return NextResponse.json({ ok:true })
}
