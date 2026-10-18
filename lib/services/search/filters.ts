import type { JobPosting } from '@/lib/integrations/search-apis/types';

export type RegionFilter =
  | 'any'
  | 'remote'
  | 'rwanda'
  | 'africa'
  | 'united-states'
  | 'europe'
  | 'united-kingdom'
  | 'canada'
  | 'asia'
  | 'oceania';

export type RoleTypeFilter = 'any' | JobPosting['roleType'];

/**
 * Locations that mean "hireable from anywhere", so a job seeker in Rwanda can
 * apply even though the posting is not located in Rwanda.
 */
const GLOBAL_LOCATION = /\b(worldwide|anywhere|global|international|emea)\b/i;

const regionKeywords: Record<Exclude<RegionFilter, 'any' | 'remote'>, string[]> = {
  rwanda: ['rwanda', 'kigali', 'east africa', 'africa'],
  africa: [
    'africa',
    'african',
    'rwanda',
    'kigali',
    'kenya',
    'nairobi',
    'uganda',
    'kampala',
    'tanzania',
    'dar es salaam',
    'burundi',
    'bujumbura',
    'ethiopia',
    'addis ababa',
    'nigeria',
    'lagos',
    'abuja',
    'ghana',
    'accra',
    'south africa',
    'johannesburg',
    'cape town',
    'egypt',
    'cairo',
    'morocco',
    'casablanca',
    'tunisia',
    'algeria',
    'senegal',
    'dakar',
    'zambia',
    'zimbabwe',
    'botswana',
    'cameroon',
    'ivory coast',
    "cote d'ivoire",
  ],
  'united-states': ['usa', 'u.s.', 'united states', 'america', 'new york', 'san francisco', 'seattle', 'austin'],
  europe: [
    'europe',
    'european',
    'emea',
    'germany',
    'france',
    'netherlands',
    'spain',
    'poland',
    'portugal',
    'sweden',
    'berlin',
    'paris',
    'amsterdam',
  ],
  'united-kingdom': ['uk', 'united kingdom', 'great britain', 'england', 'london', 'scotland'],
  canada: ['canada', 'toronto', 'vancouver', 'montreal'],
  asia: ['asia', 'india', 'singapore', 'japan', 'apac', 'bangalore', 'manila'],
  oceania: ['australia', 'new zealand', 'oceania', 'sydney', 'melbourne', 'auckland'],
};

export function matchesRegion(job: JobPosting, region: RegionFilter): boolean {
  if (region === 'any') return true;
  if (region === 'remote') return job.remote;

  // The Jobweb Rwanda board only lists Rwandan employers, and some postings
  // give a site name ("Burera site") instead of the country.
  if (job.source === 'jobwebrwanda' && (region === 'rwanda' || region === 'africa')) return true;

  const location = job.location.toLowerCase();
  if (regionKeywords[region].some((keyword) => location.includes(keyword))) return true;

  // "Worldwide" / "Anywhere" remote roles are open to this region too, which is
  // how most remote-friendly employers advertise African hiring.
  return job.remote && GLOBAL_LOCATION.test(job.location);
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
