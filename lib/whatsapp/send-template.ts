import { createAdminClient } from '@/lib/supabase/admin';

export interface SendWhatsAppTemplateInput {
  integrationId: string;
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: string[];
}

export type SendWhatsAppTemplateResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

const DEFAULT_LANGUAGE_CODE = 'pt_BR';
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;

/**
 * Keeps only the digits of a phone number.
 * The caller must provide the number already including the country code (DDI);
 * no DDI is added automatically.
 */
function normalizePhoneNumber(to: string): string {
  return to.replace(/\D/g, '');
}

/**
 * Sends an official WhatsApp template message through the Meta Graph API.
 *
 * This is a backend-only helper. The access token is read from
 * `integration_credentials`, sent exclusively in the `Authorization` header,
 * and never logged or embedded in a URL.
 */
export async function sendWhatsAppTemplateMessage(
  input: SendWhatsAppTemplateInput
): Promise<SendWhatsAppTemplateResult> {
  const adminSupabase = createAdminClient();

  // 1. Resolve the integration and enforce provider/status.
  const { data: integration, error: integrationError } = await adminSupabase
    .from('integrations')
    .select('id, provider, status')
    .eq('id', input.integrationId)
    .maybeSingle();

  if (integrationError) {
    return { success: false, error: 'Failed to load integration' };
  }

  if (!integration || integration.provider !== 'whatsapp') {
    return { success: false, error: 'WhatsApp integration not found' };
  }

  if (integration.status !== 'active') {
    return { success: false, error: 'WhatsApp integration is not active' };
  }

  // 2. Load the credentials for this integration.
  const { data: credentials, error: credentialsError } = await adminSupabase
    .from('integration_credentials')
    .select('credentials')
    .eq('integration_id', input.integrationId)
    .maybeSingle();

  if (credentialsError) {
    return { success: false, error: 'Failed to load integration credentials' };
  }

  const accessToken = credentials?.credentials?.access_token;
  const phoneNumberId = credentials?.credentials?.phone_number_id;

  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return { success: false, error: 'WhatsApp access token is not configured' };
  }

  if (typeof phoneNumberId !== 'string' || phoneNumberId.trim().length === 0) {
    return { success: false, error: 'WhatsApp phone number id is not configured' };
  }

  // 3. Validate the recipient (digits only, country code already included).
  const normalizedTo = normalizePhoneNumber(input.to ?? '');

  if (normalizedTo.length < MIN_PHONE_DIGITS || normalizedTo.length > MAX_PHONE_DIGITS) {
    return { success: false, error: 'Invalid recipient phone number' };
  }

  // 4. Validate the template name and language.
  const templateName = (input.templateName ?? '').trim();

  if (templateName.length === 0) {
    return { success: false, error: 'Template name cannot be empty' };
  }

  const languageCode = input.languageCode ?? DEFAULT_LANGUAGE_CODE;

  const parameters = Array.isArray(input.bodyParameters)
    ? input.bodyParameters.map((value) => value.trim())
    : [];

  const template: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: string;
      parameters: Array<{ type: string; text: string }>;
    }>;
  } = {
    name: templateName,
    language: {
      code: languageCode,
    },
  };

  // `components` is only included when there is at least one body parameter.
  if (parameters.length > 0) {
    template.components = [
      {
        type: 'body',
        parameters: parameters.map((value) => ({
          type: 'text',
          text: value,
        })),
      },
    ];
  }

  // 5. The Graph API version must be explicitly configured (no hardcoded fallback).
  const apiVersion = process.env.META_API_VERSION;

  if (!apiVersion) {
    return { success: false, error: 'META_API_VERSION is not configured' };
  }

  const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'template',
        template,
      }),
    });

    // 6. On error, return a safe message that never exposes credentials.
    if (!response.ok) {
      return {
        success: false,
        error: `WhatsApp API request failed (${response.status})`,
      };
    }

    const data: any = await response.json();
    const messageId = data?.messages?.[0]?.id;

    if (typeof messageId !== 'string' || messageId.length === 0) {
      return { success: false, error: 'WhatsApp API response did not include a message id' };
    }

    return { success: true, messageId };
  } catch {
    // Never leak the access token, the recipient or the parameter values.
    return { success: false, error: 'Failed to reach the WhatsApp API' };
  }
}
