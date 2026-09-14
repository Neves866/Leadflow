-- LeadFlow Foundation Schema
-- FASE D1: FUNDAÇÃO DO BANCO DE DADOS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    UNIQUE(organization_id, user_id)
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
    UNIQUE(organization_id, key)
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
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE form_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    key text NOT NULL,
    title text,
    subtitle text,
    sort_order integer DEFAULT 0,
    UNIQUE(form_id, key)
);

CREATE TABLE form_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id uuid NOT NULL REFERENCES form_steps(id) ON DELETE CASCADE,
    key text NOT NULL,
    type text NOT NULL,
    label text NOT NULL,
    placeholder text,
    required boolean DEFAULT false,
    options jsonb,
    show_when jsonb,
    sort_order integer DEFAULT 0,
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
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE pipeline_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    key text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0,
    is_closed boolean DEFAULT false,
    UNIQUE(pipeline_id, key)
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
    updated_at timestamptz DEFAULT now()
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
    contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    service_id uuid REFERENCES services(id) ON DELETE SET NULL,
    form_id uuid REFERENCES forms(id) ON DELETE SET NULL,
    pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
    stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
    assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    title text,
    source text,
    urgency text,
    potential_value numeric,
    notes text,
    protocol text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(organization_id, protocol)
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
    form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    answers jsonb NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 9. ACTIVITIES
-- -----------------------------------------------------------------------------
CREATE TABLE activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    type text NOT NULL,
    data jsonb,
    created_at timestamptz DEFAULT now()
);

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

-- Policies: users can only access data belonging to organizations they are members of.
-- We use a helper function or a direct check against organization_members.

-- Helper to check if user belongs to organization
-- Since we are in a migration, we can create a function to simplify policies.
CREATE OR REPLACE FUNCTION public.is_member_of(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations Policy
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = organizations.id AND user_id = auth.uid()
    ));

-- Organization Members Policy
CREATE POLICY "Members can view their own membership" ON organization_members
    FOR SELECT USING (user_id = auth.uid());

-- Profiles Policy
CREATE POLICY "Users can view profiles of people in their organization" ON profiles
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM organization_members om1
        JOIN organization_members om2 ON om1.organization_id = om2.organization_id
        WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id
    ));

-- General Policy for all other multi-tenant tables
-- We repeat this for each table that has organization_id.

-- Services
CREATE POLICY "Users can access services of their organization" ON services
    FOR ALL USING (is_member_of(organization_id));

-- Forms
CREATE POLICY "Users can access forms of their organization" ON forms
    FOR ALL USING (is_member_of(organization_id));

-- Form Steps
CREATE POLICY "Users can access form steps of their organization" ON form_steps
    FOR ALL USING (EXISTS (
        SELECT 1 FROM forms f WHERE f.id = form_steps.form_id AND is_member_of(f.organization_id)
    ));

-- Form Fields
CREATE POLICY "Users can access form fields of their organization" ON form_fields
    FOR ALL USING (EXISTS (
        SELECT 1 FROM form_steps fs
        JOIN forms f ON fs.form_id = f.id
        WHERE fs.id = form_fields.step_id AND is_member_of(f.organization_id)
    ));

-- Pipelines
CREATE POLICY "Users can access pipelines of their organization" ON pipelines
    FOR ALL USING (is_member_of(organization_id));

-- Pipeline Stages
CREATE POLICY "Users can access pipeline stages of their organization" ON pipeline_stages
    FOR ALL USING (EXISTS (
        SELECT 1 FROM pipelines p WHERE p.id = pipeline_stages.pipeline_id AND is_member_of(p.organization_id)
    ));

-- Contacts
CREATE POLICY "Users can access contacts of their organization" ON contacts
    FOR ALL USING (is_member_of(organization_id));

-- Leads
CREATE POLICY "Users can access leads of their organization" ON leads
    FOR ALL USING (is_member_of(organization_id));

-- Form Submissions
CREATE POLICY "Users can access submissions of their organization" ON form_submissions
    FOR ALL USING (is_member_of(organization_id));

-- Activities
CREATE POLICY "Users can access activities of their organization" ON activities
    FOR ALL USING (is_member_of(organization_id));
