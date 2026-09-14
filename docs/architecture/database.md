# Database Architecture - LeadFlow

This document describes the initial database schema for LeadFlow, designed for high-integrity multi-tenancy.

## Core Concepts

The system follows a **shared database, shared schema** multi-tenancy model. Every tenant-specific record is isolated by an `organization_id`.

## Schema Overview

### 1. Multi-Tenancy Foundation
- **`organizations`**: The root of the multi-tenancy.
- **`profiles`**: Extends `auth.users` with application-specific details.
- **`organization_members`**: Maps users to organizations with roles (`owner`, `admin`, `member`). This is the source of truth for access control.

### 2. Configuration
- **`services`**: Defines services offered by an organization.
- **`forms`**: Defines public forms for lead capture.
- **`form_steps` & `form_fields`**: Defines the structure, sequence, and conditional logic of forms.

### 3. Sales Pipeline
- **`pipelines`**: Defined per organization. Only one pipeline can be marked as `is_default` per organization.
- **`pipeline_stages`**: Individual steps within a pipeline.

### 4. Lead Management
- **`contacts`**: Identity of a person within an organization.
- **`leads`**: A sales opportunity linked to a contact, service, form, and pipeline stage.
- **`form_submissions`**: An **immutable** record of what was submitted via a public form.
- **`activities`**: An **append-only** chronological log of events associated with a lead.

## Multi-Tenant Integrity

To prevent "cross-tenant leakage" at the database level (even if RLS is bypassed), the system uses **Composite Foreign Keys**.

### Integrity Rule
Instead of referencing only a Primary Key (e.g., `service_id`), child tables reference both the ID and the `organization_id`:
`FOREIGN KEY (service_id, organization_id) REFERENCES services(id, organization_id)`

This ensures that a lead cannot be linked to a service that belongs to a different organization, as the `organization_id` must match across both tables.

### Advanced Integrity Constraints
- **Pipeline-Stage Binding**: To prevent assigning a lead to a stage that doesn't belong to its pipeline, the system uses a composite FK: `(stage_id, pipeline_id, organization_id)`.
- **Lead Ownership**: The `assigned_user_id` is validated via a composite FK against `organization_members`, ensuring the assigned user actually belongs to the lead's organization.
- **Tenant Identification**: A record's tenant is identified either directly via its `organization_id` or inherited via a composite FK from its parent.

## Security & Isolation (RLS)

Data isolation is enforced via **Row Level Security (RLS)** and hardened helper functions.

### Hardened Access Control
All security checks are performed by functions in a **private schema**, configured with `SECURITY DEFINER` and `SET search_path = ''` to prevent search-path hijacking.

- **`private.is_member_of(org_id)`**: Checks if the authenticated user is a member of the organization.
- **`private.is_org_admin(org_id)`**: Checks if the authenticated user is an `owner` or `admin`.
- **`private.is_org_owner(org_id)`**: Checks if the authenticated user is an `owner`.

### Permissions Matrix

| Entity | Member (SELECT) | Member (Write) | Admin (Write) | Owner (Write) | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Organizations** | ✅ | ❌ | ✅ | ✅ | Update only |
| **Memberships** | ✅ | ❌ | ✅ (Member only) | ✅ | Admins cannot promote to Admin/Owner |
| **Profiles** | ✅ | ❌ | ❌ | ❌ | Update own only |
| **Config** (Services, Forms, etc) | ✅ | ❌ | ✅ | ✅ | Configuration locked to admins |
| **CRM** (Contacts, Leads) | ✅ | ✅ | ✅ | ✅ | Open to all members |
| **Submissions** | ✅ | ❌ | ❌ | ❌ | **Immutable** |
| **Activities** | ✅ | ✅ | ✅ | ✅ | **Append-only** (No Update/Delete) |

### Authorization Layers
The system uses two complementary layers of security:
1. **Grants**: Explicitly define which roles (`authenticated`, `anon`) can execute which SQL operations on tables. `anon` has no direct access to CRM/Config tables.
2. **RLS**: Determines exactly which rows within a table can be accessed based on the authenticated user's organization membership.

### Public Forms
The public browser **cannot** insert directly into the database.
`Public Form` $\rightarrow$ `LeadFlow API` $\rightarrow$ `Backend Validation` $\rightarrow$ `Database Insert`.
The `organization_id` is resolved on the server via the form slug.

## Data Preservation
To ensure historical accuracy:
- **Immutability**: `form_submissions` and `activities` are immutable.
- **Hard Delete Protection**: `ON DELETE RESTRICT` is used for leads with history and forms with submissions. Data should be logically deactivated (via `active` flag) rather than physically deleted.
- **Future**: Soft delete (`archived_at`) may be implemented in later phases.

## Initial Tenant: Iluminar
Iluminar is the first production tenant. The seed data provides the specific services and pipeline used in the MVP.
