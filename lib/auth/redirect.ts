export function getSafeNextPath(value: string | null | undefined): string {
  if (!value) return '/painel';

  // Must start with '/' and NOT '//'
  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/painel';
  }

  // Must be within /painel routes to prevent access to other areas via 'next'
  if (!value.startsWith('/painel')) {
    return '/painel';
  }

  // Basic protection against backslashes in path
  if (value.includes('\\')) {
    return '/painel';
  }

  return value;
}
