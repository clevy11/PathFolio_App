import type { JobPosting, JobSearchParams, RoleType } from './types';
import { inferRoleType } from './role-type';
import { matchesQuery } from './query-match';

const API_URL = 'https://opportunityapi.ini.rw/api/opportunities';
const SITE_URL = 'https://opportunity.ini.rw/en/opportunities';

export interface OpportunityRwRecord {
  id: string;
  title_en: string;
  slug: string;
  description_en?: string;
  company_name?: string;
  location_en?: string;
  employment_type_en?: string;
  skills?: string;
  created_at?: string;
  closing_date?: string | null;
  apply_url?: string | null;
}

const typeMap: Record<string, RoleType> = {
  'full-time': 'full-time',
  fulltime: 'full-time',
  'part-time': 'part-time',
  parttime: 'part-time',
  contract: 'contract',
  internship: 'internship',
  temporary: 'temporary',
};

function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
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

export function mapOpportunityRw(record: OpportunityRwRecord): JobPosting {
  const description = stripHtml(record.description_en ?? '');
  const skills = (record.skills ?? '').trim();
  const employmentType = (record.employment_type_en ?? '').toLowerCase().trim();

  return {
    id: `opportunityrw:${record.id}`,
    source: 'opportunityrw',
    title: record.title_en.trim(),
    company: (record.company_name ?? 'Not specified').trim(),
    location: (record.location_en ?? 'Rwanda').trim() || 'Rwanda',
    remote: /remote/i.test(record.location_en ?? '') || /remote/i.test(description.slice(0, 400)),
    roleType: typeMap[employmentType] ?? inferRoleType(record.title_en, employmentType),
    url: `${SITE_URL}/${record.slug}`,
    description: skills ? `${description}\nSkills: ${skills}`.slice(0, 6000) : description.slice(0, 6000),
    postedAt: record.created_at,
    deadline: record.closing_date ?? undefined,
  };
}

/**
 * opportunity.ini.rw publishes approved Rwandan jobs, internships, scholarships
 * and grants through a public JSON API. It returns at most 250 records per
 * request and has no keyword parameter, so filtering happens locally.
 */
export async function searchOpportunityRw(params: JobSearchParams): Promise<JobPosting[]> {
  const url = new URL(API_URL);
  url.searchParams.set('type', 'job');
  url.searchParams.set('limit', '250');

  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Pathfolio/0.1 (+job search)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`opportunity.ini.rw API returned ${response.status}`);

  const records = (await response.json()) as OpportunityRwRecord[] | null;
  if (!Array.isArray(records)) return [];

  return records
    .filter((record) =>
      matchesQuery(
        `${record.title_en} ${record.company_name ?? ''} ${stripHtml(record.description_en ?? '')} ${record.skills ?? ''}`,
        params.query
      )
    )
    .map(mapOpportunityRw)
    .slice(0, params.limit ?? 25);
}
