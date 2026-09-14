-- LeadFlow Foundation Schema
-- FASE D1: FUNDAÇÃO DO BANCO DE DADOS (Final Patched Version)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 0. PRIVATE SCHEMA & SECURITY HELPERS
-- -----------------------------------------------------------------------------
CREATE SCHEMA private;

-- Grant usage to authenticated role so they can access the functions inside
GRANT USAGE ON SCHEMA private TO authenticated;

-- Helper to update updated_at timestamp
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Helper to check membership
CREATE OR REPLACE FUNCTION private.is_member_of(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Helper to check admin role (Admin or Owner)
CREATE OR REPLACE FUNCTION private.is_org_admin(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Helper to check owner role
CREATE OR REPLACE FUNCTION private.is_org_owner(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- -----------------------------------------------------------------------------
-- SECURITY GRANTS FOR HELPERS
-- -----------------------------------------------------------------------------

-- Revoke EXECUTE from PUBLIC for everything in private schema
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM authenticated;

-- Grant EXECUTE ONLY for authorization helpers to authenticated role
GRANT EXECUTE ON FUNCTION private.is_member_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_org_owner(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. PROFILES & MEMBERSHIPS
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    phone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE organization_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(organization_id, user_id),
    UNIQUE(user_id, organization_id) -- Required for Composite FKs in Leads
);

-- -----------------------------------------------------------------------------
-- 3. SERVICES
-- -----------------------------------------------------------------------------
CREATE TABLE services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key text NOT NULL,
    name text NOT NULL,
    icon text,
    service_template text,
    active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(organization_id, key),
    UNIQUE(id, organization_id) -- Required for composite FKs
);

-- -----------------------------------------------------------------------------
-- 4. FORMS
-- -----------------------------------------------------------------------------
CREATE TABLE forms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(id, organization_id) -- Required for composite FKs
);

CREATE TABLE form_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id uuid NOT NULL,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key text NOT NULL,
    title text,
    subtitle text,
    sort_order integer DEFAULT 0,
    FOREIGN KEY (form_id, organization_id) REFERENCES forms(id, organization_id) ON DELETE CASCADE,
    UNIQUE(form_id, key),
    UNIQUE(id, organization_id) -- Required for composite FKs
);

CREATE TABLE form_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id uuid NOT NULL,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key text NOT NULL,
    type text NOT NULL,
    label text NOT NULL,
    placeholder text,
    required boolean DEFAULT false,
    options jsonb,
    show_when jsonb,
    sort_order integer DEFAULT 0,
    FOREIGN KEY (step_id, organization_id) REFERENCES form_steps(id, organization_id) ON DELETE CASCADE,
    UNIQUE(step_id, key)
);

-- -----------------------------------------------------------------------------
-- 5. PIPELINES
-- -----------------------------------------------------------------------------
CREATE TABLE pipelines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(id, organization_id) -- Required for composite FKs
);

-- Prevent multiple default pipelines per organization
CREATE UNIQUE INDEX idx_one_default_pipeline_per_org
ON pipelines (organization_id)
WHERE (is_default = true);

CREATE TABLE pipeline_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id uuid NOT NULL,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0,
    is_closed boolean DEFAULT false,
    FOREIGN KEY (pipeline_id, organization_id) REFERENCES pipelines(id, organization_id) ON DELETE CASCADE,
    UNIQUE(pipeline_id, key),
    UNIQUE(id, pipeline_id, organization_id) -- Required for Stage-Pipeline link in Leads
);

-- -----------------------------------------------------------------------------
-- 6. CONTACTS
-- -----------------------------------------------------------------------------
CREATE TABLE contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text,
    email text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(id, organization_id) -- Required for composite FKs
);

CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);

-- -----------------------------------------------------------------------------
-- 7. LEADS
-- -----------------------------------------------------------------------------
CREATE TABLE leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id uuid NOT NULL,
    service_id uuid,
    form_id uuid,
    pipeline_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    assigned_user_id uuid,
    title text,
    source text,
    urgency text,
    potential_value numeric,
    notes text,
    protocol text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Composite Foreign Keys ensuring multi-tenant integrity
    -- changed CASCADE to RESTRICT for contacts to preserve lead history
    FOREIGN KEY (contact_id, organization_id) REFERENCES contacts(id, organization_id) ON DELETE RESTRICT,
    FOREIGN KEY (service_id, organization_id) REFERENCES services(id, organization_id) ON DELETE RESTRICT,
    FOREIGN KEY (form_id, organization_id) REFERENCES forms(id, organization_id) ON DELETE RESTRICT,
    FOREIGN KEY (pipeline_id, organization_id) REFERENCES pipelines(id, organization_id) ON DELETE RESTRICT,
    -- Stage must belong to the specific Pipeline and Organization of the lead
    FOREIGN KEY (stage_id, pipeline_id, organization_id) REFERENCES pipeline_stages(id, pipeline_id, organization_id) ON DELETE RESTRICT,
    -- Assigned User must belong to the organization
    FOREIGN KEY (assigned_user_id, organization_id) REFERENCES organization_members(user_id, organization_id) ON DELETE RESTRICT,

    UNIQUE(organization_id, protocol),
    UNIQUE(id, organization_id) -- Required for composite FKs
);

CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_stage_id ON leads(stage_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_contact_id ON leads(contact_id);

-- -----------------------------------------------------------------------------
-- 8. FORM SUBMISSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE form_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    form_id uuid NOT NULL,
    lead_id uuid,
    answers jsonb NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),

    -- Preserve submissions even if form is deleted (forms should be deactivated)
    FOREIGN KEY (form_id, organization_id) REFERENCES forms(id, organization_id) ON DELETE RESTRICT,
    FOREIGN KEY (lead_id, organization_id) REFERENCES leads(id, organization_id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 9. ACTIVITIES
-- -----------------------------------------------------------------------------
CREATE TABLE activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL,
    actor_user_id uuid,
    type text NOT NULL,
    data jsonb,
    created_at timestamptz DEFAULT now(),

    -- Preserve activities even if lead is deleted (hard delete blocked anyway)
    FOREIGN KEY (lead_id, organization_id) REFERENCES leads(id, organization_id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- AUTOMATION & CLEANUP TRIGGERS
-- -----------------------------------------------------------------------------

-- 1. updated_at Trigger
-- (Definition is already in private.set_updated_at above)

-- 2. Partial SET NULL Triggers
-- Since Composite FKs with ON DELETE SET NULL null all columns,
-- we use triggers to null only the reference ID, keeping organization_id intact.

CREATE OR REPLACE FUNCTION private.cleanup_service_deletion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.leads SET service_id = NULL WHERE service_id = OLD.id AND organization_id = OLD.organization_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION private.cleanup_form_deletion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.leads SET form_id = NULL WHERE form_id = OLD.id AND organization_id = OLD.organization_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION private.cleanup_member_deletion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.leads SET assigned_user_id = NULL WHERE assigned_user_id = OLD.user_id AND organization_id = OLD.organization_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Apply updated_at trigger
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE TRIGGER tr_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at()', t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Attach cleanup triggers
CREATE TRIGGER tr_cleanup_services BEFORE DELETE ON services FOR EACH ROW EXECUTE FUNCTION private.cleanup_service_deletion();
CREATE TRIGGER tr_cleanup_forms BEFORE DELETE ON forms FOR EACH ROW EXECUTE FUNCTION private.cleanup_form_deletion();
CREATE TRIGGER tr_cleanup_members BEFORE DELETE ON organization_members FOR EACH ROW EXECUTE FUNCTION private.cleanup_member_deletion();

-- -----------------------------------------------------------------------------
-- EXPLICIT TABLE GRANTS
-- -----------------------------------------------------------------------------

-- 1. Revoke all from anon (Public forms use LeadFlow API, not direct DB access)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- 2. Explicit grants for authenticated users
GRANT SELECT, UPDATE ON organizations TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON form_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON form_fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pipelines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pipeline_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO authenticated;
GRANT SELECT ON form_submissions TO authenticated;
GRANT SELECT, INSERT ON activities TO authenticated;

-- -----------------------------------------------------------------------------
-- MULTI-TENANCY & RLS
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
CREATE POLICY "Members can view their organizations" ON organizations
    FOR SELECT USING (private.is_member_of(id));

CREATE POLICY "Admins can update their organizations" ON organizations
    FOR UPDATE USING (private.is_org_admin(id));

-- Organization Members Policies
-- Fix: Avoid recursion by using helper.
CREATE POLICY "Members can view their org memberships" ON organization_members
    FOR SELECT USING (private.is_member_of(organization_id));

-- Privilege Escalation Protection:
-- Owners can manage anyone. Admins can only manage 'member' role.
CREATE POLICY "Owners can manage all memberships" ON organization_members
    FOR ALL USING (private.is_org_owner(organization_id));

CREATE POLICY "Admins can manage members" ON organization_members
    FOR ALL USING (
        private.is_org_admin(organization_id) AND
        (role = 'member')
    )
    WITH CHECK (
        private.is_org_admin(organization_id) AND
        (role = 'member')
    );

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Members can view profiles of their org mates" ON profiles
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM organization_members om1
        JOIN organization_members om2 ON om1.organization_id = om2.organization_id
        WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id
    ));

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Configuration Policies (Services, Forms, Pipelines, Stages)
CREATE POLICY "Members can view services" ON services FOR SELECT USING (private.is_member_of(organization_id));
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (private.is_org_admin(organization_id));

CREATE POLICY "Members can view forms" ON forms FOR SELECT USING (private.is_member_of(organization_id));
CREATE POLICY "Admins can manage forms" ON forms FOR ALL USING (private.is_org_admin(organization_id));

CREATE POLICY "Members can view form steps" ON form_steps FOR SELECT USING (
    EXISTS (SELECT 1 FROM forms f WHERE f.id = form_steps.form_id AND private.is_member_of(f.organization_id))
);
CREATE POLICY "Admins can manage form steps" ON form_steps FOR ALL USING (
    EXISTS (SELECT 1 FROM forms f WHERE f.id = form_steps.form_id AND private.is_org_admin(f.organization_id))
);

CREATE POLICY "Members can view form fields" ON form_fields FOR SELECT USING (
    EXISTS (SELECT 1 FROM form_steps fs JOIN forms f ON fs.form_id = f.id WHERE fs.id = form_fields.step_id AND private.is_member_of(f.organization_id))
);
CREATE POLICY "Admins can manage form fields" ON form_fields FOR ALL USING (
    EXISTS (SELECT 1 FROM form_steps fs JOIN forms f ON fs.form_id = f.id WHERE fs.id = form_fields.step_id AND private.is_org_admin(f.organization_id))
);

CREATE POLICY "Members can view pipelines" ON pipelines FOR SELECT USING (private.is_member_of(organization_id));
CREATE POLICY "Admins can manage pipelines" ON pipelines FOR ALL USING (private.is_org_admin(organization_id));

CREATE POLICY "Members can view pipeline stages" ON pipeline_stages FOR SELECT USING (
    EXISTS (SELECT 1 FROM pipelines p WHERE p.id = pipeline_stages.pipeline_id AND private.is_member_of(p.organization_id))
);
CREATE POLICY "Admins can manage pipeline stages" ON pipeline_stages FOR ALL USING (
    EXISTS (SELECT 1 FROM pipelines p WHERE p.id = pipeline_stages.pipeline_id AND private.is_org_admin(p.organization_id))
);

-- CRM Policies (Contacts, Leads)
CREATE POLICY "Members can manage contacts" ON contacts FOR ALL USING (private.is_member_of(organization_id));
CREATE POLICY "Members can manage leads" ON leads FOR ALL USING (private.is_member_of(organization_id));

-- Form Submissions Policies
CREATE POLICY "Members can view submissions" ON form_submissions
    FOR SELECT USING (private.is_member_of(organization_id));

-- Activities Policies
CREATE POLICY "Members can view activities" ON activities
    FOR SELECT USING (private.is_member_of(organization_id));

CREATE POLICY "Members can create activities" ON activities
    FOR INSERT WITH CHECK (
        private.is_member_of(organization_id) AND
        (actor_user_id IS NULL OR actor_user_id = auth.uid())
    );
