import type { JobPosting, JobSource } from '@/lib/integrations/search-apis/types';
import { searchRemotive } from '@/lib/integrations/search-apis/remotive';
import { searchGreenhouse } from '@/lib/integrations/search-apis/greenhouse';
import { searchLever } from '@/lib/integrations/search-apis/lever';
import { searchAdzuna, isAdzunaConfigured } from '@/lib/integrations/search-apis/adzuna';
import { searchJooble, isJoobleConfigured } from '@/lib/integrations/search-apis/jooble';
import { searchJobicy, jobicyGeosForRegion } from '@/lib/integrations/search-apis/jobicy';
import { searchJobwebRwanda } from '@/lib/integrations/search-apis/jobwebrwanda';
import { searchOpportunityRw } from '@/lib/integrations/search-apis/opportunity-rw';
import { dedupeJobs, filterJobs, type RegionFilter, type RoleTypeFilter } from './filters';
import { isOpen } from './deadline';
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
  africa: 'za',
  rwanda: 'za',
  'any': 'us',
  remote: 'us',
};

const AFRICA_REGIONS: RegionFilter[] = ['any', 'rwanda', 'africa', 'remote'];

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
  includeClosed?: boolean;
}): Promise<JobSearchResult> {
  const { query, region, roleType, profileSkills, limit = 30, includeClosed = false } = options;
  const searchParams = { query, limit: 40 };
  const usesAfricaBoards = AFRICA_REGIONS.includes(region);

  const pending: Array<[JobSource, Promise<JobPosting[]>]> = [
    ['remotive', searchRemotive(searchParams)],
    ['greenhouse', searchGreenhouse(searchParams)],
    ['lever', searchLever(searchParams)],
    ['jobicy', searchJobicy(searchParams, { geo: jobicyGeosForRegion(region) })],
  ];

  if (usesAfricaBoards) {
    pending.push(['jobwebrwanda', searchJobwebRwanda(searchParams)]);
    pending.push(['opportunityrw', searchOpportunityRw(searchParams)]);
  }
  if (isAdzunaConfigured()) {
    pending.push(['adzuna', searchAdzuna(searchParams, { region: adzunaCountry[region] ?? 'us' })]);
  }
  if (isJoobleConfigured()) {
    pending.push(['jooble', searchJooble(searchParams, { region: adzunaCountry[region] ?? 'us' })]);
  }

  const outcomes = await Promise.allSettled(pending.map(([, promise]) => promise));
  const sources = pending.map(([source], index) => status(source, outcomes[index], true));
  if (!usesAfricaBoards) {
    sources.push({ source: 'jobwebrwanda', used: false, ok: false, count: 0, error: 'skipped (Rwanda board is only used for Africa searches)' });
    sources.push({ source: 'opportunityrw', used: false, ok: false, count: 0, error: 'skipped (Rwanda board is only used for Africa searches)' });
  }
  if (!isAdzunaConfigured()) {
    sources.push({ source: 'adzuna', used: false, ok: false, count: 0, error: 'not configured (ADZUNA_APP_ID/ADZUNA_APP_KEY)' });
  }
  if (!isJoobleConfigured()) {
    sources.push({ source: 'jooble', used: false, ok: false, count: 0, error: 'not configured (JOOBLE_API_KEY)' });
  }

  const allJobs = outcomes.flatMap((outcome) => (outcome.status === 'fulfilled' ? outcome.value : []));
  const filtered = filterJobs(dedupeJobs(allJobs), region, roleType);
  const openJobs = includeClosed ? filtered : filtered.filter((job) => isOpen(job));

  const jobs = openJobs
    .map((job) => ({ ...job, match: scoreMatch(job, profileSkills) }))
    .sort((a, b) => {
      const aOpen = isOpen(a);
      const bOpen = isOpen(b);
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      if (b.match.score !== a.match.score) return b.match.score - a.match.score;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return (b.postedAt ?? '').localeCompare(a.postedAt ?? '');
    })
    .slice(0, limit);

  return { jobs, sources };
}

export { type RegionFilter, type RoleTypeFilter } from './filters';
export { scoreMatch, type MatchResult } from './match';
export { isOpen, daysUntil } from './deadline';
