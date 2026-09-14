export type FieldType = 'text' | 'tel' | 'textarea' | 'select';

export interface FormFieldConfig {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  order: number;
  showWhen?: {
    field: string;
    equals: string;
  };
}

export interface FormStepConfig {
  id: string;
  title: string;
  subtitle: string;
  fields: FormFieldConfig[];
}

export interface FormConfig {
  id: string;
  slug: string;
  steps: FormStepConfig[];
}

export interface ServiceConfig {
  id: string;
  label: string;
  icon: string;
  // Optional template to compose the lead's "servico" description from form
  // answers. Placeholders like {fieldId} are resolved from formData by the
  // FormRenderer. When absent, the service label is used instead.
  servicoTemplate?: string;
  formConfigId?: string; // Links to a specific form config if the service has unique questions
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

export interface OrganizationConfig {
  id: string;
  slug: string;
  name: string;
  branding: BrandingConfig;
  services: ServiceConfig[];
  forms: FormConfig[];
}
