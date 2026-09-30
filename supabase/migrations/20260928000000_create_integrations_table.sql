-- Migration: Create Integrations Infrastructure
-- Focus: Secure multi-tenant structure for external service connections

-- 1. Integrations Table (Public Metadata)
CREATE TABLE public.integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider text NOT NULL,
    external_account_id text NOT NULL,
    external_account_name text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'error')),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Prevent duplicate integration of the same account within the same organization
    UNIQUE(organization_id, provider, external_account_id)
);

-- Index for fast lookups by organization and provider
CREATE INDEX idx_integrations_organization_provider ON public.integrations(organization_id, provider);

-- Attach updated_at trigger
CREATE TRIGGER tr_update_integrations
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

-- 2. Integration Credentials Table (Sensitive Data)
CREATE TABLE public.integration_credentials (
    integration_id uuid PRIMARY KEY REFERENCES public.integrations(id) ON DELETE CASCADE,
    credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Attach updated_at trigger to credentials
CREATE TRIGGER tr_update_integration_credentials
    BEFORE UPDATE ON public.integration_credentials
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------------------------------------

-- Public Integrations: Shared access for members, management for admins
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organization integrations"
    ON public.integrations
    FOR SELECT
    USING (private.is_member_of(organization_id));

CREATE POLICY "Admins can manage organization integrations"
    ON public.integrations
    FOR ALL
    USING (private.is_org_admin(organization_id))
    WITH CHECK (private.is_org_admin(organization_id));

-- Integration Credentials: ABSOLUTELY NO PUBLIC ACCESS
-- We enable RLS but provide NO policies.
-- This means the 'authenticated' and 'anon' roles will have zero access.
-- Only the 'service_role' (used by createAdminClient) bypasses RLS.
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.integration_credentials FROM anon, authenticated;
GRANT ALL ON TABLE public.integration_credentials TO service_role;
