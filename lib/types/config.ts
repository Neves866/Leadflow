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
  servicoTemplate?: string;
  formConfigId?: string;
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

export interface PublicContactConfig {
  whatsapp?: string;
  websiteUrl?: string;
  websiteLabel?: string;
}

export interface OrganizationConfig {
  id: string;
  slug: string;
  name: string;
  branding: BrandingConfig;
  publicContact?: PublicContactConfig;
  services: ServiceConfig[];
  forms: FormConfig[];
}
