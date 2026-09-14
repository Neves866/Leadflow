import { OrganizationConfig, FormConfig } from '@/lib/types/config';
import { iluminarConfig } from './organizations/iluminar';

const organizations: Record<string, OrganizationConfig> = {
  'iluminar': iluminarConfig,
};

export function getOrganizationConfig(slug: string): OrganizationConfig | undefined {
  return organizations[slug];
}

export function getFormConfig(orgSlug: string, formSlug: string): FormConfig | undefined {
  const org = getOrganizationConfig(orgSlug);
  if (!org) return undefined;

  return org.forms.find(f => f.slug === formSlug);
}

export function getFormConfigBySlug(formSlug: string) {
  for (const org of Object.values(organizations)) {
    const form = org.forms.find(f => f.slug === formSlug);
    if (form) {
      return { organization: org, form };
    }
  }
  return undefined;
}
