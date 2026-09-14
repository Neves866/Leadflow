export function getSafeNextPath(value: string | null | undefined): string {
  if (!value) return '/painel';

  // Must start with '/' and NOT '//'
  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/painel';
  }

  // Must be strictly /painel or start with /painel/ or /painel?
  const isExactPainel = value === '/painel';
  const isPainelSubPath = value.startsWith('/painel/');
  const isPainelQuery = value.startsWith('/painel?');

  if (!isExactPainel && !isPainelSubPath && !isPainelQuery) {
    return '/painel';
  }

  // Basic protection against backslashes in path
  if (value.includes('\\')) {
    return '/painel';
  }

  return value;
}
