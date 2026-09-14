# Database Architecture - LeadFlow

This document describes the initial database schema for LeadFlow, designed for multi-tenancy from the ground up.

## Core Concepts

The system follows a **shared database, shared schema** multi-tenancy model. Every tenant-specific table contains an `organization_id` to ensure strict data isolation.

## Schema Overview

### 1. Multi-Tenancy Foundation
- **`organizations`**: The root of the multi-tenancy. Each client is an organization.
- **`profiles`**: Extends `auth.users` with application-specific details.
- **`organization_members`**: Maps users to organizations with specific roles (`owner`, `admin`, `member`). This table is the source of truth for RLS policies.

### 2. Configuration
- **`services`**: Replaces the static TypeScript `ServiceConfig`. Defines the services offered by an organization (e.g., "Air Conditioning", "Electrical").
- **`forms`**: Defines the public forms available for lead capture.
- **`form_steps` & `form_fields`**: Defines the structure, sequence, and validation of the forms.

### 3. Sales Pipeline
- **`pipelines`**: Organizations can have multiple pipelines, one of which is marked as default.
- **`pipeline_stages`**: The individual steps within a pipeline (e.g., "New" $\rightarrow$ "Qualified" $\rightarrow$ "Closed").

### 4. Lead Management
- **`contacts`**: Unique identity for a person across different leads within the same organization.
- **`leads`**: The central entity representing a sales opportunity. Linked to a contact, service, form, and a specific stage in a pipeline.
- **`form_submissions`**: An immutable record of what was submitted via a public form. This ensures that even if a lead is updated, the original submission data is preserved.
- **`activities`**: A chronological log of events (timeline) associated with a lead.

## Entity Relationship Diagram (Conceptual)

`organizations` $\rightarrow$ `organization_members` $\rightarrow$ `profiles`
`organizations` $\rightarrow$ `services`
`organizations` $\rightarrow$ `forms` $\rightarrow$ `form_steps` $\rightarrow$ `form_fields`
`organizations` $\rightarrow$ `pipelines` $\rightarrow$ `pipeline_stages`
`organizations` $\rightarrow$ `contacts` $\rightarrow$ `leads` $\leftarrow$ `pipeline_stages`
`leads` $\rightarrow$ `form_submissions`
`leads` $\rightarrow$ `activities`

## Security & Isolation (RLS)

Data isolation is enforced via **Row Level Security (RLS)**.

1. **Membership Check**: A helper function `is_member_of(org_id)` checks if the current `auth.uid()` exists in `organization_members` for the given `org_id`.
2. **Strict Access**: All tenant-specific tables have policies that prevent access unless `is_member_of(organization_id)` returns true.
3. **Public Forms**: Public users cannot perform direct inserts into the database. The intended flow is:
   `Public Form` $\rightarrow$ `LeadFlow API` $\rightarrow$ `Backend Validation` $\rightarrow$ `Database Insert`.
   The `organization_id` is determined on the server based on the form slug, never trusted from the client.

## Initial Tenant: Iluminar

Iluminar is the first production tenant. While the schema is generic, the seed data establishes Iluminar's specific services and pipeline to accelerate MVP development.
