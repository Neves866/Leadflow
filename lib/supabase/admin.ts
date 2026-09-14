import { createClient } from '@supabase/supabase-js';

/**
 * Admin client for privileged operations.
 * MUST NEVER be used in Client Components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
