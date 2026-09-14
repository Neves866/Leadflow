-- Seed for Iluminar (First Tenant)
-- This file populates the initial structure for the MVP.

-- 1. Organization
INSERT INTO organizations (slug, name)
VALUES ('iluminar', 'Iluminar');

-- Use a variable or subquery to get the organization ID throughout the seed
DO $$
DECLARE
    org_id uuid;
    pipe_id uuid;
    form_id uuid;
    step_details_id uuid;
    step_contact_id uuid;
BEGIN
    SELECT id INTO org_id FROM organizations WHERE slug = 'iluminar';

    -- 2. Services
    INSERT INTO services (organization_id, key, name, icon, service_template, sort_order)
    VALUES
    (org_id, 'ar', 'Ar-condicionado', '❄️', '{serviceType} ({btus} BTUs)', 1),
    (org_id, 'eletr', 'Instalações Elétricas', '⚡', NULL, 2),
    (org_id, 'seg', 'Segurança Eletrônica', '🛡️', NULL, 3),
    (org_id, 'auto', 'Automação Residencial', '🏠', NULL, 4);

    -- 3. Form
    INSERT INTO forms (organization_id, slug, name)
    VALUES (org_id, 'iluminar-orcamento', 'Orçamento Iluminar')
    RETURNING id INTO form_id;

    -- 4. Form Steps
    INSERT INTO form_steps (form_id, organization_id, key, title, subtitle, sort_order)
    VALUES
    (form_id, org_id, 'details', 'Detalhes do Serviço', 'Conte-nos mais sobre sua necessidade.', 1)
    RETURNING id INTO step_details_id;

    INSERT INTO form_steps (form_id, organization_id, key, title, subtitle, sort_order)
    VALUES
    (form_id, org_id, 'contact', 'Contato', 'Quase lá! Como podemos entrar em contato com você?', 2)
    RETURNING id INTO step_contact_id;

    -- 5. Form Fields (Step: details)
    INSERT INTO form_fields (step_id, organization_id, key, type, label, placeholder, required, options, show_when, sort_order)
    VALUES
    (step_details_id, org_id, 'serviceType', 'select', 'Tipo de Serviço', NULL, false, '[{"label": "Instalação", "value": "Instalação"}, {"label": "Manutenção", "value": "Manutenção"}, {"label": "Higienização", "value": "Higienização"}]', '{"field": "serviceId", "equals": "ar"}', 1),
    (step_details_id, org_id, 'btus', 'text', 'Capacidade (BTUs)', 'Ex: 9000, 12000', false, NULL, '{"field": "serviceId", "equals": "ar"}', 2),
    (step_details_id, org_id, 'hasEquipment', 'select', 'Já possui equipamento?', NULL, false, '[{"label": "Sim", "value": "Sim"}, {"label": "Não", "value": "Não"}]', '{"field": "serviceId", "equals": "ar"}', 3),
    (step_details_id, org_id, 'backToBack', 'select', 'Instalação costas a costas?', NULL, false, '[{"label": "Sim", "value": "Sim"}, {"label": "Não", "value": "Não"}]', '{"field": "serviceId", "equals": "ar"}', 4),
    (step_details_id, org_id, 'city', 'text', 'Cidade', NULL, false, NULL, NULL, 5),
    (step_details_id, org_id, 'neighborhood', 'text', 'Bairro', NULL, false, NULL, NULL, 6),
    (step_details_id, org_id, 'urgency', 'select', 'Urgência', NULL, false, '[{"label": "Baixa", "value": "Baixa"}, {"label": "Média", "value": "Média"}, {"label": "Alta", "value": "Alta"}]', NULL, 7),
    (step_details_id, org_id, 'notes', 'textarea', 'Observações', NULL, false, NULL, NULL, 8);

    -- 6. Form Fields (Step: contact)
    INSERT INTO form_fields (step_id, organization_id, key, type, label, placeholder, required, sort_order)
    VALUES
    (step_contact_id, org_id, 'name', 'text', 'Nome Completo', NULL, true, 1),
    (step_contact_id, org_id, 'whatsapp', 'tel', 'WhatsApp', '(00) 00000-0000', true, 2);

    -- 7. Default Pipeline
    INSERT INTO pipelines (organization_id, name, is_default)
    VALUES (org_id, 'Pipeline Padrão', true)
    RETURNING id INTO pipe_id;

    -- 8. Pipeline Stages
    INSERT INTO pipeline_stages (pipeline_id, organization_id, key, name, sort_order, is_closed)
    VALUES
    (pipe_id, org_id, 'novo', 'Novo', 1, false),
    (pipe_id, org_id, 'qualificado', 'Qualificado', 2, false),
    (pipe_id, org_id, 'orcamento', 'Orçamento', 3, false),
    (pipe_id, org_id, 'negociacao', 'Negociação', 4, false),
    (pipe_id, org_id, 'fechado', 'Fechado', 5, true);
END $$;
