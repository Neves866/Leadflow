-- Migration: External Lead Events for Deduplication
-- Focus: Prevent duplicate lead creation from webhook events with strong multi-tenant integrity

-- 1. Allow composite foreign keys referencing integrations
ALTER TABLE public.integrations
ADD CONSTRAINT integrations_id_organization_unique
UNIQUE (id, organization_id);

-- 2. Create External Lead Events Table
CREATE TABLE public.external_lead_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,

    integration_id uuid NOT NULL,

    provider text NOT NULL,
    external_id text NOT NULL,

    lead_id uuid,

    status text NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'processed', 'error')),

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    last_error text,

    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,

    -- Integration must belong to the same organization
    FOREIGN KEY (integration_id, organization_id)
        REFERENCES public.integrations(id, organization_id)
        ON DELETE CASCADE,

    -- Lead must belong to the same organization
    FOREIGN KEY (lead_id, organization_id)
        REFERENCES public.leads(id, organization_id)
        ON DELETE RESTRICT,

    -- Prevent duplicate processing
    UNIQUE (integration_id, external_id)
);

CREATE INDEX idx_external_lead_events_status
ON public.external_lead_events(status);

CREATE INDEX idx_external_lead_events_external_id
ON public.external_lead_events(external_id);

-- Backend-only table
ALTER TABLE public.external_lead_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.external_lead_events FROM anon, authenticated;
GRANT ALL ON TABLE public.external_lead_events TO service_role;