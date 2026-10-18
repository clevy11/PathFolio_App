import type { JobPosting, JobSearchParams, RoleType } from './types';

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs';

const roleTypeMap: Record<string, RoleType> = {
  full_time: 'full-time',
  full-time: 'full-time',
  contract: 'contract',
  part_time: 'part-time',
  'part-time': 'part-time',
  internship: 'internship',
  temporary: 'temporary',
};

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  job_type: string;
  url: string;
  description: string;
  publication_date: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchRemotive(params: JobSearchParams): Promise<JobPosting[]> {
  const url = new URL(REMOTIVE_URL);
  url.searchParams.set('search', params.query);
  url.searchParams.set('limit', String(params.limit ?? 20));

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Remotive API returned ${response.status}`);
  const data = (await response.json()) as { jobs?: RemotiveJob[] };

  return (data.jobs ?? []).map((job) => {
    const location = job.candidate_required_location || 'Not specified';
    return {
      id: `remotive:${job.id}`,
      source: 'remotive' as const,
      title: job.title,
      company: job.company_name,
      location,
      remote: /remote/i.test(location) || /remote/i.test(job.title),
      roleType: roleTypeMap[job.job_type?.toLowerCase()] ?? 'unknown',
      url: job.url,
      description: stripHtml(job.description ?? '').slice(0, 2000),
      postedAt: job.publication_date,
    };
  });
}