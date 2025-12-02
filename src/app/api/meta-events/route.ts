import { NextResponse } from 'next/server';
import { headers } from 'next/headers'; 
import * as crypto from 'crypto';

// Configuration (Must match your .env.local file)
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const EVENT_SOURCE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aliigo.com';

/** Helper to hash PII data (REQUIRED by Meta) */
function hashSHA256(value: string): string {
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/**
 * Handles server-side CAPI event submissions.
 */
export async function POST(request: Request) {
  if (!ACCESS_TOKEN || !PIXEL_ID) {
    console.error("Meta CAPI is not configured");
    return NextResponse.json({ success: false, error: "Server configuration missing" }, { status: 500 });
  }

  try {
    const { event_name, email, fbc, fbp } = await request.json();
    
    // Server-collected data: IP and User Agent from headers
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || ''; 
    const clientUserAgent = headersList.get('user-agent') || ''; 

    // Construct the payload with all required parameters
    const eventData = {
      data: [{
        event_name: event_name, 
        event_time: Math.floor(Date.now() / 1000), 
        event_source_url: EVENT_SOURCE_URL, 
        action_source: "website",
        
        user_data: {
          // PII data (MUST BE HASHED)
          em: [email ? hashSHA256(email) : undefined], 
          
          // Deduplication and Attribution Data (DO NOT HASH)
          fbc: fbc, 
          fbp: fbp, 
          client_ip_address: clientIp,      
          client_user_agent: clientUserAgent,
        },
      }],
      // Use the test code ONLY for testing, then remove for production
      test_event_code: process.env.NODE_ENV === 'development' ? 'TEST47569' : undefined, 
    };

    const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    const metaResult = await metaResponse.json();

    if (metaResponse.ok) {
      console.log(`CAPI Success: ${event_name}`);
      return NextResponse.json({ success: true, metaResponse: metaResult });
    } else {
      console.error(`CAPI Error for ${event_name}:`, metaResult);
      return NextResponse.json({ success: false, error: metaResult }, { status: 500 });
    }
  } catch (error) {
    console.error("CAPI Runtime Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}