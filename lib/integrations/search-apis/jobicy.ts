import type { JobPosting, JobSearchParams, RoleType } from './types';
import { inferRoleType } from './role-type';

const API_URL = 'https://jobicy.com/api/v2/remote-jobs';

export interface JobicyOptions {
  geo?: string[];
}

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo?: string;
  jobType?: string[];
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
}

const typeMap: Record<string, RoleType> = {
  'full time': 'full-time',
  'full-time': 'full-time',
  'part time': 'part-time',
  'part-time': 'part-time',
  contract: 'contract',
  freelance: 'contract',
  internship: 'internship',
  temporary: 'temporary',
};

const REGION_GEO: Record<string, string[]> = {
  any: ['anywhere'],
  rwanda: ['anywhere', 'emea'],
  africa: ['anywhere', 'emea'],
  remote: ['anywhere'],
  europe: ['europe'],
  'united-kingdom': ['anywhere'],
  'united-states': ['anywhere'],
  canada: ['anywhere'],
  asia: ['apac', 'anywhere'],
  oceania: ['anywhere'],
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapJobicyJob(job: JobicyJob): JobPosting {
  const location = job.jobGeo?.trim() || 'Anywhere';
  const types = job.jobType ?? [];
  const mappedType = types
    .map((type) => typeMap[type.toLowerCase().trim()] ?? inferRoleType(job.jobTitle, type))
    .find((type) => type !== 'unknown');
  const description = stripHtml(job.jobDescription || job.jobExcerpt || '').slice(0, 6000);

  return {
    id: `jobicy:${job.id}`,
    source: 'jobicy',
    title: job.jobTitle.trim(),
    company: job.companyName.trim(),
    location,
    remote: true,
    roleType: mappedType ?? 'unknown',
    url: job.url,
    description,
    postedAt: job.pubDate,
  };
}

/**
 * Jobicy is a free remote-job API. Its `geo` slug is a hiring region, not a
 * country, so Africa/Rwanda searches use "anywhere" (open to any country) plus
 * "emea" (which includes Africa).
 */
export async function searchJobicy(params: JobSearchParams, options: JobicyOptions = {}): Promise<JobPosting[]> {
  const query = params.query.trim();
  if (!query) return [];

  const geos = options.geo?.length ? options.geo : ['anywhere'];
  const limit = params.limit ?? 25;

  const results = await Promise.all(
    geos.map(async (geo) => {
      const url = new URL(API_URL);
      url.searchParams.set('count', String(limit));
      url.searchParams.set('tag', query);
      url.searchParams.set('geo', geo);

      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Jobicy API returned ${response.status}`);
      const data = (await response.json()) as { jobs?: JobicyJob[] | null };
      return (data.jobs ?? []).map(mapJobicyJob);
    })
  );

  const seen = new Set<string>();
  return results
    .flat()
    .filter((job) => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    })
    .slice(0, limit);
}

export function jobicyGeosForRegion(region: string): string[] {
  return REGION_GEO[region] ?? ['anywhere'];
}
