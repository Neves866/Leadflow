# Implementation Plan: Generic Public Form System

## Overview
Transition the hardcoded demo form into a generic, slug-based form system that can support multiple organizations and forms.

## Requirements Traceability
- [ ] New route `/f/[slug]/page.tsx` using `getFormConfigBySlug`.
- [ ] Update Iluminar form slug: 'demo' -> 'iluminar-orcamento'.
- [ ] Reusable `FormRenderer.tsx` with dynamic fields and `showWhen` logic.
- [ ] `getFormConfigBySlug` implementation in `lib/config/index.ts`.
- [ ] Enhanced `localStorage` lead data (orgId, formId, formSlug) while keeping `servico`.
- [ ] Redirect `/formulario/demo` to `/f/iluminar-orcamento`.
- [ ] "Form not found" state.

## Detailed Implementation Steps

### 1. Configuration Changes
- **File: `lib/config/organizations/iluminar.ts`**
    - Locate the `forms` array in `iluminarConfig`.
    - Change the `slug` of the demo form from `'demo'` to `'iluminar-orcamento'`.

- **File: `lib/config/index.ts`**
    - Implement `getFormConfigBySlug(slug: string)`:
        - Search through all configured organizations.
        - Find the organization that contains a form with the matching slug.
        - Return both the organization config and the form config.
        - Signature: `export function getFormConfigBySlug(slug: string): { org: OrganizationConfig; form: FormConfig } | undefined`

### 2. Core Component: `FormRenderer.tsx`
- **Location**: `components/forms/FormRenderer.tsx`
- **State Management**:
    - `formData`: `Record<string, string>` to store all input values.
    - `currentStep`: `'category' | 'details' | 'contact'` (or a numeric index).
- **Step Logic**:
    - **Category Step**: Render buttons based on `orgConfig.services`. On select, set `formData.category` and move to next step.
    - **Details Step**: 
        - Find the step with `id === 'details'` in `formConfig`.
        - Map through fields.
        - Implement `showWhen`: `if (field.showWhen && formData[field.showWhen.field] !== field.showWhen.equals) return null;`.
        - Render `select`, `textarea`, or `input` based on `field.type`.
    - **Contact Step**:
        - Find the step with `id === 'contact'` in `formConfig`.
        - Map through fields, ensuring `required` attributes are handled.
- **Submission Logic**:
    - Generate a protocol number.
    - Construct the lead object for `localStorage`:
        - `organizationId`: `orgConfig.id`
        - `formId`: `formConfig.id`
        - `formSlug`: `formConfig.slug`
        - `servico`: 
            - If `formData.category === 'Ar-condicionado'`, use `"${formData.serviceType} (${formData.btus} BTUs)"`.
            - Else, use `formData.category`.
        - Map other `formData` values to lead fields (`nome`, `telefone`, `observacoes`, etc.).
        - Keep `respostas` object for raw data.
    - Save to `leadflow_leads` and redirect to `/sucesso`.

### 3. Routing and Redirection
- **New Route: `app/f/[slug]/page.tsx`**
    - Read `params.slug`.
    - Call `getFormConfigBySlug(slug)`.
    - If `undefined`: Render a "Form Not Found" message (with a link back to home).
    - If found: Render `<FormRenderer orgConfig={res.org} formConfig={res.form} />`.

- **Redirect: `app/formulario/demo/page.tsx`**
    - Replace content with `redirect('/f/iluminar-orcamento')` from `next/navigation`.

## Architectural Decisions & Trade-offs
- **State Structure**: Using `Record<string, string>` for `formData` allows the form to be completely dynamic regardless of the fields defined in the config.
- **`showWhen` Logic**: A simple equality check is used as requested. This can be expanded in the future to support more complex predicates.
- **`localStorage` Strategy**: Adding metadata fields while preserving the `servico` key ensures that the existing dashboard (which likely relies on `servico`) continues to function without modification.

## Critical Files for Implementation
- `lib/config/index.ts`
- `lib/config/organizations/iluminar.ts`
- `components/forms/FormRenderer.tsx`
- `app/f/[slug]/page.tsx`
- `app/formulario/demo/page.tsx`
EOF`
