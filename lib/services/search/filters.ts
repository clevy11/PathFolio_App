import type { JobPosting, RoleType } from '@/lib/integrations/search-apis/types';

export type RegionFilter =
  | 'any'
  | 'remote'
  | 'united-states'
  | 'europe'
  | 'united-kingdom'
  | 'canada'
  | 'africa'
  | 'asia'
  | 'oceania';

export type RoleTypeFilter = 'any' | RoleType;

const regionKeywords: Record<Exclude<RegionFilter, 'any' | 'remote'>, string[]> = {
  'united-states': ['usa', 'u.s.', 'united states', 'us ', 'america'],
  europe: ['europe', 'eu ', 'european', 'germany', 'france', 'netherlands', 'spain', 'poland', 'portugal', 'sweden'],
  'united-kingdom': ['uk', 'united kingdom', 'great britain', 'england', 'london', 'scotland'],
  canada: ['canada', 'toronto', 'vancouver', 'montreal'],
  africa: ['africa', 'nigeria', 'kenya', 'south africa', 'ghana', 'egypt'],
  asia: ['asia', 'india', 'singapore', 'japan', 'remote - apac', 'apac'],
  oceania: ['australia', 'new zealand', 'oceania', 'sydney', 'melbourne'],
};

export function matchesRegion(job: JobPosting, region: RegionFilter): boolean {
  if (region === 'any') return true;
  if (region === 'remote') return job.remote;
  const location = job.location.toLowerCase();
  return regionKeywords[region].some((keyword) => location.includes(keyword));
}

export function matchesRoleType(job: JobPosting, roleType: RoleTypeFilter): boolean {
  if (roleType === 'any') return true;
  return job.roleType === roleType;
}

export function filterJobs(jobs: JobPosting[], region: RegionFilter, roleType: RoleTypeFilter): JobPosting[] {
  return jobs.filter((job) => matchesRegion(job, region) && matchesRoleType(job, roleType));
}

/** Greenhouse/Lever/companies often return near-identical postings. */
export function dedupeJobs(jobs: JobPosting[]): JobPosting[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.title.trim().toLowerCase()}|${job.company.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}