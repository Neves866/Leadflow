import { NextRequest, NextResponse } from 'next/server';
import { validateMetaSignature, processMetaLeadgenEvent } from '@/lib/meta/webhook';

/**
 * GET handler for Meta Webhook verification.
 * Expects hub.mode, hub.verify_token, and hub.challenge.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * POST handler for Meta Webhook events.
 * Receives JSON and returns 200 quickly.
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Hub-Signature-256');

    // Use raw body for signature validation
    const rawBody = await request.text();

    if (!validateMetaSignature(rawBody, signature)) {
      console.warn('[Meta Webhook] Invalid signature');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Secure log: log only structural metadata to avoid leaking PII in logs
    console.log('[Meta Webhook] Event received:', JSON.stringify({
      timestamp: new Date().toISOString(),
      object: body?.object,
      entry_count: body?.entry?.length,
    }));

    // Process only leadgen events
    if (body.object === 'page') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'leadgen') {
            const { leadgen_id, page_id } = change.value;

            // Process the lead inline and await completion, so the event is
            // finalised before Meta receives the 200 response.
            await processMetaLeadgenEvent(page_id, leadgen_id, change.value);
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[Meta Webhook] Error processing POST:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
