# Multi-tenancy Architecture - LeadFlow

LeadFlow is transitioning from a single-client demo (Iluminar) to a generic multi-tenant SaaS platform.

## Core Concept

The platform maintains a single codebase. Behavioral and visual differences between organizations are driven by a configuration model rather than hardcoded logic.

## Configuration Model

Each organization is defined by an `OrganizationConfig` which includes:

- **Identity**: Stable ID, slug, and name.
- **Branding**: Visual settings (colors, logos).
- **Services**: The list of services offered by the organization.
- **Forms**: The structure of lead capture forms (steps and fields).

### Form Configuration
Forms are defined as a sequence of steps. Each step contains a set of fields. Fields can be:
- **Static**: Always visible.
- **Conditional**: Visible only when certain conditions are met (e.g., `showWhen: { field: 'category', equals: 'Ar-condicionado' }`).

## Current State & Evolution

### Phase 1: Decoupling (Concluded)
- Move hardcoded data to TypeScript configuration files.
- Interface reads from this configuration.
- Iluminar is the only configuration.

### Phase 2: Generic Public Forms (Current)
- Implementation of the `/f/[slug]` public route.
- Forms are discovered via a globally unique `FormConfig.slug`.
- Logic is decoupled from organization names, using stable IDs for services and fields.
- A generic `FormRenderer` handles rendering based on the configuration.

### Phase 3: Dynamic Rendering (Next)
- Transition from semi-dynamic to fully dynamic form rendering.

### Phase 4: Persistence (Future)
- Migrate configurations from TypeScript files to a database (Supabase).
- Implement organization-based data isolation.
- Add Auth and multi-tenant API endpoints.

## Rules for Development

1. **No Hardcoding**: No component should depend on specific organization names or IDs (e.g., `if (org === 'Iluminar')` is forbidden).
2. **Configuration First**: Any change to form questions, service lists, or branding must be done in the organization's configuration.
3. **Stable Interface**: The UI should be generic enough to render any valid `OrganizationConfig`.
