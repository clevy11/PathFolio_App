import type { JobPosting, JobSearchParams, RoleType } from './types';

interface AdzunaParams {
  region?: string;
  roleType?: RoleType;
}

interface AdzunaJob {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  redirect_url: string;
  description: string;
  created?: number;
  contract_time?: string;
}

const contractMap: Record<string, RoleType> = {
  'full time': 'full-time',
  'part time': 'part-time',
  contract: 'contract',
  permanent: 'full-time',
};

/**
 * Adzuna needs credentials (ADZUNA_APP_ID / ADZUNA_APP_KEY) and a country
 * code. Returns [] when not configured so callers can skip this source.
 */
export async function searchAdzuna(
  params: JobSearchParams,
  extra: AdzunaParams = {}
): Promise<JobPosting[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const country = (extra.region ?? 'us').toLowerCase().slice(0, 2);
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('what', params.query);
  url.searchParams.set('results_per_page', String(params.limit ?? 20));

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Adzuna API returned ${response.status}`);
  const data = (await response.json()) as { results?: AdzunaJob[] };

  return (data.results ?? []).map((job) => ({
    id: `adzuna:${job.id}`,
    source: 'adzuna' as const,
    title: job.title.trim(),
    company: job.company?.display_name || 'Not specified',
    location: job.location?.display_name || 'Not specified',
    remote: /remote/i.test(job.location?.display_name ?? ''),
    roleType: contractMap[job.contract_time?.toLowerCase().replace(/[-_]/g, ' ') ?? ''] ?? 'unknown',
    url: job.redirect_url,
    description: job.description ?? '',
    postedAt: job.created ? new Date(job.created * 1000).toISOString() : undefined,
  }));
}

export function isAdzunaConfigured(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}