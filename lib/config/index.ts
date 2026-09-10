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

// Helper for the demo to get current (and only) config
export function getCurrentOrganizationConfig(): OrganizationConfig {
  return iluminarConfig;
}
