import { NextResponse } from 'next/server';

// This must match the string you added to .env.local
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

/**
 * GET: Meta Verification Handshake
 * Meta calls this once to confirm your server exists and is secure.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if the token matches your secret
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp Webhook Verified');
    // Return the challenge integer as plain text (not JSON)
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * POST: Receive Incoming Messages
 * This runs every time a customer sends a message to your WhatsApp number.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extract the message details
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      const message = value.messages[0];
      const from = message.from; // Sender's Phone Number (e.g., 34600123456)
      const text = message.text?.body; // The message content
      const name = value.contacts?.[0]?.profile?.name; // Sender's Name

      console.log(`📩 New WhatsApp Message from ${name} (${from}): ${text}`);

      // TODO: Insert into Supabase 'inbox' table here
      // await supabase.from('inbox').insert({ ... })
    }

    // 2. Always return 200 OK to Meta
    // If you fail to return 200, Meta will retry and eventually disable your webhook.
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}