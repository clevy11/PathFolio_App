import type { JobPosting, JobSearchParams, RoleType } from './types';

interface JoobleParams {
  region?: string;
  roleType?: RoleType;
}

interface JoobleJob {
  title: string;
  companyId?: string;
  location?: string;
  salary?: string;
  snippet?: string;
  link: string;
  posted?: string;
  type?: string;
}

const typeMap: Record<string, RoleType> = {
  'full time': 'full-time',
  fulltime: 'full-time',
  'part time': 'part-time',
  contract: 'contract',
  internship: 'internship',
  temporary: 'temporary',
};

/**
 * Jooble needs a key (JOOBLE_API_KEY) and is region-scoped (its region key is
 * the country code of the job feed). Returns [] when not configured.
 */
export async function searchJooble(
  params: JobSearchParams,
  extra: JoobleParams = {}
): Promise<JobPosting[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];

  const region = (extra.region ?? 'us').toLowerCase();
  const response = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: params.query, region }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Jooble API returned ${response.status}`);
  const data = (await response.json()) as { jobs?: JoobleJob[] | null };

  return (data.jobs ?? []).map((job, index) => ({
    id: `jooble:${job.link ?? index}`,
    source: 'jooble' as const,
    title: (job.title ?? '').trim(),
    company: job.companyId || 'Not specified',
    location: job.location || 'Not specified',
    remote: /remote/i.test(job.location ?? ''),
    roleType: typeMap[job.type?.toLowerCase().replace(/[-_]/g, ' ') ?? ''] ?? 'unknown',
    url: job.link,
    description: (job.snippet ?? '').replace(/<[^>]*>/g, ' ').slice(0, 2000),
    postedAt: job.posted || undefined,
  }));
}

export function isJoobleConfigured(): boolean {
  return Boolean(process.env.JOOBLE_API_KEY);
}