import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeMetaLead, cleanPhoneNumber } from './lead-normalization';

export interface MetaWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        leadgen_id: string;
        page_id: string;
        form_id?: string;
        ad_id?: string;
      };
      field: string;
    }>;
  }>;
}

const MAX_LAST_ERROR_LENGTH = 1000;

/**
 * Extracts a message from any thrown value without assuming a specific class.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === 'string') {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Unknown error';
}

/**
 * Builds a safe, bounded error message intended for `last_error` and logs.
 * It strips access tokens / app secrets and never carries full lead PII.
 */
export function sanitizeErrorMessage(error: unknown): string {
  const sanitized = extractErrorMessage(error)
    // Strip access_token query-string parameters (e.g. Graph API URLs)
    .replace(/access_token=[^&\s"']*/gi, 'access_token=[REDACTED]')
    // Strip Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    // Strip Meta-style access tokens (EAA...)
    .replace(/EAA[A-Za-z0-9_-]{10,}/g, '[REDACTED_TOKEN]');

  return sanitized.length > MAX_LAST_ERROR_LENGTH
    ? sanitized.slice(0, MAX_LAST_ERROR_LENGTH)
    : sanitized;
}

/**
 * Validates the Meta Webhook signature (X-Hub-Signature-256).
 *
 * A missing, malformed or mismatching signature always returns false and never
 * throws. The META_APP_SECRET value is never logged.
 */
export function validateMetaSignature(rawBody: string, signature: string | null): boolean {
  try {
    if (!signature) return false;

    const secret = process.env.META_APP_SECRET;
    if (!secret) {
      console.error('[Meta Webhook] META_APP_SECRET is not configured');
      return false;
    }

    // Expected format: sha256=<64 hexadecimal characters>
    const separatorIndex = signature.indexOf('=');
    if (separatorIndex === -1) return false;

    const algorithm = signature.slice(0, separatorIndex);
    const providedHash = signature.slice(separatorIndex + 1);

    if (algorithm !== 'sha256') return false;
    if (!/^[0-9a-f]{64}$/i.test(providedHash)) return false;

    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const providedBuffer = Buffer.from(providedHash, 'hex');

    // timingSafeEqual requires buffers of equal length
    if (expectedBuffer.length !== providedBuffer.length) return false;

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    // Never leak internals (or the secret) when validation itself fails
    console.error('[Meta Webhook] Failed to validate signature');
    return false;
  }
}

/**
 * Processes a Meta Leadgen event.
 *
 * Deduplication relies on the UNIQUE(integration_id, external_id) constraint:
 * the flow always attempts an INSERT first and only falls back to a controlled
 * retry path when the event already exists.
 */
export async function processMetaLeadgenEvent(
  pageId: string,
  leadgenId: string,
  metaData: any
) {
  const adminSupabase = createAdminClient();

  // 1. Resolve Integration & Organization
  const { data: integration, error: intError } = await adminSupabase
    .from('integrations')
    .select('id, organization_id')
    .eq('provider', 'meta')
    .eq('external_account_id', pageId)
    .eq('status', 'active')
    .maybeSingle();

  if (intError || !integration) {
    console.error(`[Meta Webhook] No active integration found for page ${pageId}`);
    return { success: false, error: 'Integration not found' };
  }

  const {
    organization_id: organizationId,
    id: integrationId
  } = integration;

  // 2. Atomic deduplication: the INSERT against UNIQUE(integration_id, external_id)
  //    is always the first step. A pre-existing SELECT check would introduce races.
  let eventId: string | null = null;
  let resumeLeadId: string | null = null;

  const { data: insertedEvent, error: dupError } = await adminSupabase
    .from('external_lead_events')
    .insert({
      organization_id: organizationId,
      integration_id: integrationId,
      provider: 'meta',
      external_id: leadgenId,
      status: 'processing',
      metadata: metaData,
    })
    .select('id')
    .single();

  if (!dupError) {
    eventId = insertedEvent?.id ?? null;
  } else if (dupError.code === '23505') {
    // Event already exists for this integration_id + external_id.
    const { data: existingEvent, error: existingError } = await adminSupabase
      .from('external_lead_events')
      .select('id, status, lead_id')
      .eq('integration_id', integrationId)
      .eq('external_id', leadgenId)
      .maybeSingle();

    if (existingError || !existingEvent) {
      console.error(`[Meta Webhook] Unable to load existing event ${leadgenId}`);
      return { success: false, error: 'Failed to load existing event' };
    }

    // Already finished: nothing left to do.
    if (existingEvent.status === 'processed') {
      console.log(`[Meta Webhook] Event already processed: ${leadgenId}`);
      return { success: true, duplicate: true };
    }

    // Another execution is still working on it.
    if (existingEvent.status === 'processing') {
      console.log(`[Meta Webhook] Event already processing: ${leadgenId}`);
      return { success: true, duplicate: true, processing: true };
    }

    // status === 'error': Meta retried a previously failed event, so attempt a
    // safe claim (error -> processing). The status filter makes it atomic.
    const { data: claimedEvent, error: claimError } = await adminSupabase
      .from('external_lead_events')
      .update({ status: 'processing', last_error: null })
      .eq('id', existingEvent.id)
      .eq('status', 'error')
      .select('id, lead_id')
      .maybeSingle();

    if (claimError) {
      console.error(`[Meta Webhook] Failed to claim event ${leadgenId}: ${sanitizeErrorMessage(claimError)}`);
      return { success: false, error: 'Failed to claim event' };
    }

    if (!claimedEvent) {
      // Another execution claimed it first: this run must stop.
      console.log(`[Meta Webhook] Event already claimed by another execution: ${leadgenId}`);
      return { success: true, duplicate: true, processing: true };
    }

    eventId = claimedEvent.id;
    resumeLeadId = claimedEvent.lead_id ?? null;
  } else {
    console.error(`[Meta Webhook] Error inserting event record: ${sanitizeErrorMessage(dupError)}`);
    return { success: false, error: 'Failed to register event' };
  }

  if (!eventId) {
    console.error(`[Meta Webhook] Event record could not be resolved for ${leadgenId}`);
    return { success: false, error: 'Failed to register event' };
  }

  try {
    // 3. Fetch and validate the Page Access Token
    const { data: creds, error: credError } = await adminSupabase
      .from('integration_credentials')
      .select('credentials')
      .eq('integration_id', integrationId)
      .maybeSingle();

    if (credError) throw credError;
    if (!creds) throw new Error('Credentials not found');

    const pageAccessToken = creds.credentials?.page_access_token;

    // The token must exist, be a non-empty string. Its value is never logged.
    if (typeof pageAccessToken !== 'string' || pageAccessToken.trim().length === 0) {
      throw new Error('Page access token not found');
    }

    // 4. Graph API version must be explicitly configured (no hardcoded fallback)
    const apiVersion = process.env.META_API_VERSION;

    if (!apiVersion) {
      throw new Error('META_API_VERSION is not configured');
    }

    // 5. Fetch Lead Data from Graph API
    //    The Page Access Token is sent as a Bearer header, never in the URL.
    const graphUrl = `https://graph.facebook.com/${apiVersion}/${leadgenId}?fields=id,created_time,form_id,ad_id,adset_id,campaign_id,field_data`;

    const response = await fetch(graphUrl, {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    });

    const leadData: any = await response.json();

    if (!response.ok) {
      throw new Error(`Meta API Error: ${leadData?.error?.message || response.statusText}`);
    }

    // 6. Normalization
    const normalized = normalizeMetaLead(leadData.field_data || []);
    const cleanPhone = cleanPhoneNumber(normalized.phone);

    // 6.1 Persist the Graph identifiers and the custom form answers.
    //     The original webhook metadata is preserved. Answers are never logged.
    const eventMetadata = {
      ...(metaData && typeof metaData === 'object' ? metaData : {}),
      graph: {
        id: leadData?.id ?? null,
        created_time: leadData?.created_time ?? null,
        form_id: leadData?.form_id ?? null,
        ad_id: leadData?.ad_id ?? null,
        adset_id: leadData?.adset_id ?? null,
        campaign_id: leadData?.campaign_id ?? null,
      },
      additional_answers: normalized.additionalData,
    };

    const { error: metadataError } = await adminSupabase
      .from('external_lead_events')
      .update({ metadata: eventMetadata })
      .eq('id', eventId);

    if (metadataError) throw metadataError;

    // 7. Lead resolution.
    //    When resuming a previously failed event that already linked a lead,
    //    never create another contact/lead: reuse the existing one.
    let leadId: string | null = resumeLeadId;

    if (leadId) {
      const { data: existingLead, error: existingLeadError } = await adminSupabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingLeadError) throw existingLeadError;

      if (!existingLead) {
        throw new Error('Existing lead not found for organization');
      }
    } else {
      // 7.1 Contact resolution: phone first, then email, always scoped by organization.
      let contactId: string;
      let existingContact: { id: string } | null = null;

      if (cleanPhone) {
        const { data: byPhone, error: phoneErr } = await adminSupabase
          .from('contacts')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('phone', cleanPhone)
          .maybeSingle();

        // A database error must never be interpreted as "contact does not exist"
        if (phoneErr) throw phoneErr;
        if (byPhone) existingContact = byPhone;
      }

      // Only look up by email when no contact matched the phone
      if (!existingContact && normalized.email) {
        const { data: byEmail, error: emailErr } = await adminSupabase
          .from('contacts')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('email', normalized.email)
          .maybeSingle();

        if (emailErr) throw emailErr;
        if (byEmail) existingContact = byEmail;
      }

      if (existingContact) {
        contactId = existingContact.id;

        // Update contact name if it's more complete (scoped to the organization)
        if (normalized.fullName) {
          const { error: contactUpdateError } = await adminSupabase
            .from('contacts')
            .update({ name: normalized.fullName })
            .eq('id', contactId)
            .eq('organization_id', organizationId);

          if (contactUpdateError) throw contactUpdateError;
        }
      } else {
        const { data: newContact, error: createContactError } = await adminSupabase
          .from('contacts')
          .insert({
            organization_id: organizationId,
            name: normalized.fullName || 'Lead Meta',
            phone: cleanPhone,
            email: normalized.email,
          })
          .select()
          .single();

        if (createContactError) throw createContactError;
        contactId = newContact.id;
      }

      // 7.2 Lead creation
      // Find default pipeline and "novo" stage
      const { data: pipeline, error: pipeError } = await adminSupabase
        .from('pipelines')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_default', true)
        .maybeSingle();

      if (pipeError) throw pipeError;
      if (!pipeline) {
        throw new Error('No default pipeline found for organization');
      }

      const { data: stage, error: stageError } = await adminSupabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipeline.id)
        .eq('key', 'novo')
        .maybeSingle();

      if (stageError) throw stageError;
      if (!stage) {
        throw new Error('No "novo" stage found in default pipeline');
      }

      // Generate protocol (simplified: using current date/time for this example,
      // but usually the CRM has a specific sequence)
      const protocol = `META-${Date.now()}`;

      const { data: lead, error: leadError } = await adminSupabase
        .from('leads')
        .insert({
          organization_id: organizationId,
          contact_id: contactId,
          pipeline_id: pipeline.id,
          stage_id: stage.id,
          source: 'Meta Lead Ads',
          title: `${normalized.fullName || 'Lead'} - Meta`,
          protocol: protocol,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      leadId = lead.id;

      // Persist the lead link immediately. If a later step fails, the retry must
      // reuse this lead instead of creating a second one for the same leadgen_id.
      const { error: leadIdPersistError } = await adminSupabase
        .from('external_lead_events')
        .update({ lead_id: leadId })
        .eq('id', eventId);

      if (leadIdPersistError) throw leadIdPersistError;
    }

    // 8. Activity registration (idempotent: a retry never duplicates it)
    const { data: existingActivity, error: existingActivityError } = await adminSupabase
      .from('activities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('lead_id', leadId)
      .eq('type', 'lead_created')
      .eq('data->>external_id', leadgenId)
      .maybeSingle();

    if (existingActivityError) throw existingActivityError;

    if (!existingActivity) {
      const { error: activityError } = await adminSupabase
        .from('activities')
        .insert({
          organization_id: organizationId,
          lead_id: leadId,
          type: 'lead_created',
          data: {
            source: 'Meta Lead Ads',
            provider: 'meta',
            external_id: leadgenId,
          },
        });

      if (activityError) throw activityError;
    }

    // 9. Finalize Event
    const { error: finalizeError } = await adminSupabase
      .from('external_lead_events')
      .update({
        status: 'processed',
        lead_id: leadId,
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', eventId);

    if (finalizeError) throw finalizeError;

    return { success: true, leadId };

  } catch (error: any) {
    const safeError = sanitizeErrorMessage(error);

    console.error(`[Meta Webhook] Error processing lead ${leadgenId}: ${safeError}`);

    if (eventId) {
      const { error: markError } = await adminSupabase
        .from('external_lead_events')
        .update({
          status: 'error',
          last_error: safeError,
        })
        .eq('id', eventId);

      if (markError) {
        console.error(`[Meta Webhook] Failed to persist error state for lead ${leadgenId}`);
      }
    }

    return { success: false, error: safeError };
  }
}
