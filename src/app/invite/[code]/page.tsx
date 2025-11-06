// src/app/invite/[code]/page.tsx
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default async function Invite({ params }: { params: { code: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('invites').select('*').eq('code', params.code).single()

  if (!data || data.status === 'revoked' || data.status === 'expired') {
    return <main className="p-6"><h1>Invalid invite</h1></main>
  }

  // mark redeemed (idempotent if already)
  await supabase.from('invites').update({ status:'redeemed', redeemed_at: new Date().toISOString() }).eq('id', data.id)

  // set cookie to bypass gate
  cookies().set('aliigo_invited', '1', { httpOnly: false, sameSite: 'lax', secure: true, maxAge: 60*60*24*30 })

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Invite accepted</h1>
      <p>You now have access. Continue to the app.</p>
      <Link className="underline" href="/">Go to Aliigo</Link>
    </main>
  )
}
