import type { JobPosting } from '@/lib/integrations/search-apis/types';
import { SKILL_LEXICON } from './skill-lexicon';

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

function normalize(skill: string): string {
  return skill.trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mentions(haystack: string, skill: string): boolean {
  // Word-boundary match so "go" does not match "algorithms" and vice versa.
  return new RegExp(`(^|[^a-z0-9.#])${escapeRegExp(skill)}([^a-z0-9]|$)`, 'i').test(haystack);
}

/**
 * Score = share of the skills the posting asks for that exist in the profile.
 * Skills the posting asks for = (lexicon skills + profile skills) found in the posting text.
 * Returns 0 with an empty missing list when the posting names no detectable skills.
 */
export function scoreMatch(job: JobPosting, profileSkills: string[]): MatchResult {
  const haystack = `${job.title}\n${job.description}`.toLowerCase();
  const profile = new Set(profileSkills.map(normalize).filter(Boolean));

  const requested = new Set<string>(
    [...SKILL_LEXICON, ...profile].filter((skill) => mentions(haystack, skill))
  );

  if (requested.size === 0) return { score: 0, matchedSkills: [], missingSkills: [] };

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const skill of requested) {
    if (profile.has(skill)) matchedSkills.push(skill);
    else missingSkills.push(skill);
  }

  const score = Math.round((matchedSkills.length / requested.size) * 100);
  return { score, matchedSkills, missingSkills };
}