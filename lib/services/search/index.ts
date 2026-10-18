import type { JobPosting, JobSource } from '@/lib/integrations/search-apis/types';
import { searchRemotive } from '@/lib/integrations/search-apis/remotive';
import { searchGreenhouse } from '@/lib/integrations/search-apis/greenhouse';
import { searchLever } from '@/lib/integrations/search-apis/lever';
import { searchAdzuna, isAdzunaConfigured } from '@/lib/integrations/search-apis/adzuna';
import { searchJooble, isJoobleConfigured } from '@/lib/integrations/search-apis/jooble';
import { dedupeJobs, filterJobs, type RegionFilter, type RoleTypeFilter } from './filters';
import { scoreMatch, type MatchResult } from './match';

export interface ScoredJob extends JobPosting {
  match: MatchResult;
}

export interface SourceStatus {
  source: JobSource;
  used: boolean;
  ok: boolean;
  count: number;
  error?: string;
}

export interface JobSearchResult {
  jobs: ScoredJob[];
  sources: SourceStatus[];
}

const adzunaCountry: Record<string, string> = {
  'united-states': 'us',
  'united-kingdom': 'gb',
  canada: 'ca',
  europe: 'de',
  'any': 'us',
  remote: 'us',
};

function status(source: JobSource, outcome: PromiseSettledResult<JobPosting[]>, used: boolean): SourceStatus {
  if (outcome.status === 'rejected') {
    return { source, used, ok: false, count: 0, error: String(outcome.reason?.message ?? outcome.reason).slice(0, 200) };
  }
  return { source, used, ok: true, count: outcome.value.length };
}

export async function searchJobs(options: {
  query: string;
  region: RegionFilter;
  roleType: RoleTypeFilter;
  profileSkills: string[];
  limit?: number;
}): Promise<JobSearchResult> {
  const { query, region, roleType, profileSkills, limit = 30 } = options;
  const searchParams = { query, limit: 25 };

  const pending: Array<[JobSource, Promise<JobPosting[]>, boolean]> = [
    ['remotive', searchRemotive(searchParams), true],
    ['greenhouse', searchGreenhouse(searchParams), true],
    ['lever', searchLever(searchParams), true],
  ];
  if (isAdzunaConfigured()) {
    pending.push(['adzuna', searchAdzuna(searchParams, { region: adzunaCountry[region] ?? 'us' }), true]);
  }
  if (isJoobleConfigured()) {
    pending.push(['jooble', searchJooble(searchParams, { region: adzunaCountry[region] ?? 'us' }), true]);
  }

  const outcomes = await Promise.allSettled(pending.map(([, promise]) => promise));
  const sources = pending.map(([source], index) => status(source, outcomes[index], true));
  if (!isAdzunaConfigured()) sources.push({ source: 'adzuna', used: false, ok: false, count: 0, error: 'not configured (ADZUNA_APP_ID/ADZUNA_APP_KEY)' });
  if (!isJoobleConfigured()) sources.push({ source: 'jooble', used: false, ok: false, count: 0, error: 'not configured (JOOBLE_API_KEY)' });

  const allJobs = outcomes.flatMap((outcome) => (outcome.status === 'fulfilled' ? outcome.value : []));
  const filtered = filterJobs(dedupeJobs(allJobs), region, roleType);

  const jobs = filtered
    .map((job) => ({ ...job, match: scoreMatch(job, profileSkills) }))
    .sort((a, b) => {
      if (b.match.score !== a.match.score) return b.match.score - a.match.score;
      return (b.postedAt ?? '').localeCompare(a.postedAt ?? '');
    })
    .slice(0, limit);

  return { jobs, sources };
}

export { type RegionFilter, type RoleTypeFilter } from './filters';
export { scoreMatch, type MatchResult } from './match';