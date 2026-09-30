-- Migration: Create Integration OAuth Sessions Table
-- Focus: Secure temporary storage for OAuth flow state and credentials

CREATE TABLE public.integration_oauth_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL,
    temp_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by state/id and expiration
CREATE INDEX idx_oauth_sessions_expires_at ON public.integration_oauth_sessions(expires_at);
CREATE INDEX idx_oauth_sessions_user_org ON public.integration_oauth_sessions(user_id, organization_id);

-- -----------------------------------------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.integration_oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Absolutely no policies for 'anon' or 'authenticated' roles.
-- Access is exclusively via service_role (createAdminClient).
REVOKE ALL ON TABLE public.integration_oauth_sessions FROM anon, authenticated;
GRANT ALL ON TABLE public.integration_oauth_sessions TO service_role;
