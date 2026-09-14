-- Seed for Iluminar (First Tenant)
-- This file populates the initial structure for the MVP.

-- 1. Organization
INSERT INTO organizations (slug, name)
VALUES ('iluminar', 'Iluminar');

-- Get the organization ID
-- Note: In a real seed script, we'd use variables. Here we use a subquery.

-- 2. Services
INSERT INTO services (organization_id, key, name, icon, sort_order)
VALUES
((SELECT id FROM organizations WHERE slug = 'iluminar'), 'ar', 'Ar condicionado', 'wind', 1),
((SELECT id FROM organizations WHERE slug = 'iluminar'), 'eletr', 'Elétrica', 'bolt', 2),
((SELECT id FROM organizations WHERE slug = 'iluminar'), 'seg', 'Segurança', 'shield', 3),
((SELECT id FROM organizations WHERE slug = 'iluminar'), 'auto', 'Automação', 'cpu', 4);

-- 3. Form
INSERT INTO forms (organization_id, slug, name)
VALUES ((SELECT id FROM organizations WHERE slug = 'iluminar'), 'iluminar-orcamento', 'Orçamento Iluminar');

-- 4. Default Pipeline
INSERT INTO pipelines (organization_id, name, is_default)
VALUES ((SELECT id FROM organizations WHERE slug = 'iluminar'), 'Pipeline Padrão', true);

-- 5. Pipeline Stages
INSERT INTO pipeline_stages (pipeline_id, key, name, sort_order)
VALUES
((SELECT id FROM pipelines WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'iluminar') AND is_default = true), 'novo', 'Novo', 1),
((SELECT id FROM pipelines WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'iluminar') AND is_default = true), 'qualificado', 'Qualificado', 2),
((SELECT id FROM pipelines WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'iluminar') AND is_default = true), 'orcamento', 'Orçamento', 3),
((SELECT id FROM pipelines WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'iluminar') AND is_default = true), 'negociacao', 'Negociação', 4),
((SELECT id FROM pipelines WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'iluminar') AND is_default = true), 'fechado', 'Fechado', 5);
