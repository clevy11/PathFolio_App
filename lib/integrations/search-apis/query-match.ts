const SYNONYM_GROUPS: string[][] = [
  ['developer', 'engineer', 'programmer', 'software', 'swe', 'coder'],
  ['frontend', 'front-end', 'front end', 'react', 'ui'],
  ['backend', 'back-end', 'back end', 'api', 'server'],
  ['fullstack', 'full-stack', 'full stack'],
  ['designer', 'design', 'ux', 'ui'],
  ['devops', 'sre', 'infrastructure', 'platform', 'cloud'],
  ['data', 'analytics', 'analyst', 'scientist'],
  ['manager', 'lead', 'head', 'director'],
  ['intern', 'internship', 'trainee'],
  ['admin', 'administrator', 'assistant', 'officer'],
  ['sales', 'business development', 'account executive'],
  ['finance', 'accounting', 'accountant', 'audit'],
  ['marketing', 'communications', 'growth'],
];

function words(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Expands one query token to the synonyms a posting might use instead. */
export function expandToken(token: string): string[] {
  const group = SYNONYM_GROUPS.find((entries) => entries.includes(token));
  return group ? [...group] : [token];
}

/**
 * Keyword search is literal, so "developer" misses "Software Engineer".
 * Match every query token against the posting text, allowing the small
 * synonym table above so common job titles still line up.
 */
export function matchesQuery(text: string, query: string): boolean {
  const tokens = words(query);
  if (tokens.length === 0) return true;

  const haystack = text.toLowerCase();
  return tokens.every((token) =>
    expandToken(token).some((variant) => new RegExp(`\\b${escapeRegExp(variant)}\\b`, 'i').test(haystack))
  );
}
