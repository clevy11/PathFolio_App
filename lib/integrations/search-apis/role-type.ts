import type { RoleType } from './types';

const patterns: Array<[RoleType, RegExp]> = [
  ['internship', /\b(intern|internship|trainee|apprentice)\b/i],
  ['part-time', /\bpart[\s-]?time\b/i],
  ['contract', /\b(contract|contractor|freelance|fixed[\s-]term)\b/i],
  ['temporary', /\b(temporary|temp|seasonal)\b/i],
  ['full-time', /\bfull[\s-]?time\b/i],
];

/** Used for boards (Greenhouse, Lever) that often omit an employment type. */
export function inferRoleType(...texts: Array<string | undefined>): RoleType {
  const haystack = texts.filter(Boolean).join(' ');
  if (!haystack) return 'unknown';
  for (const [roleType, pattern] of patterns) {
    if (pattern.test(haystack)) return roleType;
  }
  return 'unknown';
}
