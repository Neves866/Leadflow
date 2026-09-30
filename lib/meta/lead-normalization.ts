export interface MetaFieldData {
  name: string;
  values?: string[];
  /** Legacy single-value shape, kept only as a compatibility fallback. */
  value?: string;
}

export type MetaAdditionalValue = string | string[];

export interface NormalizedMetaLead {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  additionalData: Record<string, MetaAdditionalValue>;
}

/**
 * Extracts the valid string values of a Meta Lead Ads field.
 *
 * The Graph API returns `values: string[]`. The legacy `value: string` shape is
 * still accepted as a fallback for compatibility.
 */
function extractFieldValues(field: MetaFieldData): string[] {
  if (!field || typeof field.name !== 'string') return [];

  if (Array.isArray(field.values)) {
    return field.values.filter((value): value is string => typeof value === 'string');
  }

  if (typeof field.value === 'string') {
    return [field.value];
  }

  return [];
}

/**
 * Normalizes Meta Lead Ads field_data array into a standard object.
 *
 * Standard fields accept a single value (the first valid one). Custom form
 * answers are preserved in `additionalData`: a single answer as a string and
 * multiple answers as the full array.
 */
export function normalizeMetaLead(
  fieldData: MetaFieldData[] | null | undefined
): NormalizedMetaLead {
  const normalized: NormalizedMetaLead = {
    additionalData: {},
  };

  if (!Array.isArray(fieldData)) return normalized;

  for (const field of fieldData) {
    if (!field || typeof field.name !== 'string') continue;

    const values = extractFieldValues(field);
    if (values.length === 0) continue;

    const lowerName = field.name.toLowerCase();

    if (lowerName === 'full_name') {
      normalized.fullName = values[0];
    } else if (lowerName === 'first_name') {
      normalized.firstName = values[0];
    } else if (lowerName === 'last_name') {
      normalized.lastName = values[0];
    } else if (lowerName === 'email') {
      normalized.email = values[0];
    } else if (lowerName === 'phone_number' || lowerName === 'phone') {
      normalized.phone = values[0];
    } else {
      // Custom question: keep the answer(s) intact, never discard multi-select.
      normalized.additionalData[field.name] = values.length === 1 ? values[0] : values;
    }
  }

  // Build a full name from first/last whenever full_name is absent.
  if (!normalized.fullName) {
    const nameParts = [normalized.firstName, normalized.lastName].filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0
    );

    if (nameParts.length > 0) {
      normalized.fullName = nameParts.join(' ');
    }
  }

  return normalized;
}

/**
 * Cleans phone numbers to contain only digits.
 */
export function cleanPhoneNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}
