-- Migration: WhatsApp Integration Foundation
-- Focus: Initial multi-tenant database structure for the future WhatsApp integration.
-- Scope: STRUCTURE ONLY. No API, no webhook, no Cloudflare Queue, no Meta calls.
-- Notes:
--   * Credentials remain in public.integration_credentials (no new credentials table).
--   * The future WhatsApp integration will use integrations.provider = 'whatsapp'.
--   * No tokens and no real phone numbers are inserted by this migration.
--   * This migration only adds new tables; it does not modify existing migrations.

-- =============================================================================
-- 1. WHATSAPP CONVERSATIONS
-- =============================================================================
CREATE TABLE public.whatsapp_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,

    integration_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    lead_id uuid,

    external_wa_id text NOT NULL,

    assigned_user_id uuid,

    status text NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed', 'archived')),

    unread_count integer NOT NULL DEFAULT 0
        CHECK (unread_count >= 0),

    last_message_at timestamptz,
    last_inbound_at timestamptz,
    service_window_expires_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Integration must belong to the same organization
    FOREIGN KEY (integration_id, organization_id)
        REFERENCES public.integrations(id, organization_id)
        ON DELETE CASCADE,

    -- Contact must belong to the same organization
    FOREIGN KEY (contact_id, organization_id)
        REFERENCES public.contacts(id, organization_id)
        ON DELETE RESTRICT,

    -- Lead must belong to the same organization
    FOREIGN KEY (lead_id, organization_id)
        REFERENCES public.leads(id, organization_id)
        ON DELETE RESTRICT,

    -- Assigned user must be a member of the organization
    FOREIGN KEY (assigned_user_id, organization_id)
        REFERENCES public.organization_members(user_id, organization_id)
        ON DELETE RESTRICT,

    -- Prevent duplicate conversations for the same WhatsApp identity per integration
    UNIQUE (integration_id, external_wa_id),

    -- Required for composite FKs from whatsapp_messages
    UNIQUE (id, organization_id),

    -- Guarantees a message can only reference a conversation from the same integration
    UNIQUE (id, integration_id, organization_id)
);

CREATE INDEX idx_whatsapp_conversations_organization_id
    ON public.whatsapp_conversations(organization_id);
CREATE INDEX idx_whatsapp_conversations_contact_id
    ON public.whatsapp_conversations(contact_id);
CREATE INDEX idx_whatsapp_conversations_lead_id
    ON public.whatsapp_conversations(lead_id);
CREATE INDEX idx_whatsapp_conversations_assigned_user_id
    ON public.whatsapp_conversations(assigned_user_id);
CREATE INDEX idx_whatsapp_conversations_last_message_at
    ON public.whatsapp_conversations(last_message_at);

CREATE TRIGGER tr_update_whatsapp_conversations
    BEFORE UPDATE ON public.whatsapp_conversations
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

-- =============================================================================
-- 2. WHATSAPP MESSAGES
-- =============================================================================
CREATE TABLE public.whatsapp_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    conversation_id uuid NOT NULL,

    provider_message_id text,

    direction text NOT NULL
        CHECK (direction IN ('inbound', 'outbound')),

    message_type text NOT NULL,

    text_body text,
    template_name text,

    status text NOT NULL
        CHECK (
            status IN (
                'queued',
                'sent',
                'delivered',
                'read',
                'failed',
                'received'
            )
        ),

    actor_user_id uuid,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    error_code text,
    error_message text,

    sent_at timestamptz,
    delivered_at timestamptz,
    read_at timestamptz,
    failed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Conversation must belong to the same integration and organization
    FOREIGN KEY (conversation_id, integration_id, organization_id)
        REFERENCES public.whatsapp_conversations(id, integration_id, organization_id)
        ON DELETE CASCADE,

    -- Integration must belong to the same organization
    FOREIGN KEY (integration_id, organization_id)
        REFERENCES public.integrations(id, organization_id)
        ON DELETE CASCADE,

    -- Actor user must be a member of the organization
    FOREIGN KEY (actor_user_id, organization_id)
        REFERENCES public.organization_members(user_id, organization_id)
        ON DELETE RESTRICT
);

-- Partial unique index: provider_message_id is unique per integration when present
CREATE UNIQUE INDEX idx_whatsapp_messages_integration_provider_unique
    ON public.whatsapp_messages(integration_id, provider_message_id)
    WHERE provider_message_id IS NOT NULL;

CREATE INDEX idx_whatsapp_messages_organization_id
    ON public.whatsapp_messages(organization_id);
CREATE INDEX idx_whatsapp_messages_status
    ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_provider_message_id
    ON public.whatsapp_messages(provider_message_id);
CREATE INDEX idx_whatsapp_messages_conversation_created
    ON public.whatsapp_messages(conversation_id, created_at);

CREATE TRIGGER tr_update_whatsapp_messages
    BEFORE UPDATE ON public.whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

-- =============================================================================
-- 3. NOTIFICATION RULES
-- =============================================================================
CREATE TABLE public.notification_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,

    integration_id uuid,

    event_type text NOT NULL,
    channel text NOT NULL,

    enabled boolean NOT NULL DEFAULT true,

    config jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Integration, when present, must belong to the same organization
    FOREIGN KEY (integration_id, organization_id)
        REFERENCES public.integrations(id, organization_id)
        ON DELETE RESTRICT,

    -- One rule per event/channel within an organization
    UNIQUE (organization_id, event_type, channel),

    -- Required for composite FKs from notification_jobs
    UNIQUE (id, organization_id)
);

CREATE TRIGGER tr_update_notification_rules
    BEFORE UPDATE ON public.notification_rules
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

-- =============================================================================
-- 4. NOTIFICATION JOBS
-- =============================================================================
CREATE TABLE public.notification_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,

    rule_id uuid,
    lead_id uuid,

    channel text NOT NULL,
    event_type text NOT NULL,

    recipient text NOT NULL,

    payload jsonb NOT NULL DEFAULT '{}'::jsonb,

    status text NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'sent',
                'failed',
                'dead'
            )
        ),

    attempts integer NOT NULL DEFAULT 0
        CHECK (attempts >= 0),

    max_attempts integer NOT NULL DEFAULT 5
        CHECK (max_attempts > 0),

    scheduled_at timestamptz NOT NULL DEFAULT now(),

    provider_message_id text,
    last_error text,
    processed_at timestamptz,

    idempotency_key text NOT NULL,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Rule must belong to the same organization
    FOREIGN KEY (rule_id, organization_id)
        REFERENCES public.notification_rules(id, organization_id)
        ON DELETE RESTRICT,

    -- Lead must belong to the same organization
    FOREIGN KEY (lead_id, organization_id)
        REFERENCES public.leads(id, organization_id)
        ON DELETE RESTRICT,

    -- Deduplication isolated per organization
    UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX idx_notification_jobs_status_scheduled_at
    ON public.notification_jobs(status, scheduled_at);
CREATE INDEX idx_notification_jobs_organization_id
    ON public.notification_jobs(organization_id);
CREATE INDEX idx_notification_jobs_lead_id
    ON public.notification_jobs(lead_id);
CREATE INDEX idx_notification_jobs_provider_message_id
    ON public.notification_jobs(provider_message_id);

CREATE TRIGGER tr_update_notification_jobs
    BEFORE UPDATE ON public.notification_jobs
    FOR EACH ROW
    EXECUTE FUNCTION private.set_updated_at();

-- =============================================================================
-- 5. TABLE GRANTS
-- =============================================================================
-- anon: no access at all
-- authenticated: scoped access (see per-table grants below)
-- service_role: full access (bypasses RLS)

-- whatsapp_conversations: authenticated read-only
REVOKE ALL ON TABLE public.whatsapp_conversations FROM anon, authenticated;
GRANT SELECT ON TABLE public.whatsapp_conversations TO authenticated;
GRANT ALL ON TABLE public.whatsapp_conversations TO service_role;

-- whatsapp_messages: authenticated read-only
REVOKE ALL ON TABLE public.whatsapp_messages FROM anon, authenticated;
GRANT SELECT ON TABLE public.whatsapp_messages TO authenticated;
GRANT ALL ON TABLE public.whatsapp_messages TO service_role;

-- notification_rules: authenticated managed by org admins (enforced via RLS)
REVOKE ALL ON TABLE public.notification_rules FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_rules TO authenticated;
GRANT ALL ON TABLE public.notification_rules TO service_role;

-- notification_jobs: backend-only (no anon / authenticated access)
REVOKE ALL ON TABLE public.notification_jobs FROM anon, authenticated;
GRANT ALL ON TABLE public.notification_jobs TO service_role;

-- =============================================================================
-- 6. ROW LEVEL SECURITY
-- =============================================================================

-- whatsapp_conversations: members can read; service_role bypasses RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view whatsapp conversations"
    ON public.whatsapp_conversations
    FOR SELECT
    USING (private.is_member_of(organization_id));

-- whatsapp_messages: members can read; service_role bypasses RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view whatsapp messages"
    ON public.whatsapp_messages
    FOR SELECT
    USING (private.is_member_of(organization_id));

-- notification_rules: only org admins can manage; service_role bypasses RLS
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification rules"
    ON public.notification_rules
    FOR ALL
    USING (private.is_org_admin(organization_id))
    WITH CHECK (private.is_org_admin(organization_id));

-- notification_jobs: no anon/authenticated access, service_role only
-- RLS enabled with NO policies => anon/authenticated denied; service_role bypasses RLS.
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
