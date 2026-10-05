import { NextRequest, NextResponse } from 'next/server';
import { validateMetaSignature } from '@/lib/meta/webhook';

/**
 * GET handler for WhatsApp Cloud API webhook verification.
 * Expects hub.mode, hub.verify_token, and hub.challenge.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // The verify token is never logged.
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * POST handler for WhatsApp Cloud API webhook events.
 *
 * Signature validation reuses `validateMetaSignature` (META_APP_SECRET).
 * No messages are processed yet: a valid event is only acknowledged.
 */
export async function POST(request: NextRequest) {
  try {
    // Raw body is required for signature validation.
    const rawBody = await request.text();

    const signature = request.headers.get('x-hub-signature-256');

    if (!validateMetaSignature(rawBody, signature)) {
      console.warn('[WhatsApp Webhook] Invalid signature');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // A valid signature does not guarantee valid JSON.
    try {
      JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Secure log only: no token, no phone number, no message content, no payload.
    console.log('[WhatsApp Webhook] Event received');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error processing POST:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}