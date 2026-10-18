import type { JobPosting, JobSearchParams, RoleType } from './types';

const DEFAULT_ORGS = ['spotify'];

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: { location?: string; commitment?: string; team?: string; department?: string };
  createdAt: number;
  descriptionPlain?: string;
  lists?: Array<{ text?: string; content?: string }>;
}

const commitmentMap: Record<string, RoleType> = {
  'full-time': 'full-time',
  'part-time': 'part-time',
  contract: 'contract',
  internship: 'internship',
  temporary: 'temporary',
};

/**
 * Lever has no global search — only per-company posting feeds.
 * Searches a set of orgs and merges the results.
 */
export async function searchLever(
  params: JobSearchParams,
  orgs: string[] = DEFAULT_ORGS
): Promise<JobPosting[]> {
  const query = params.query.toLowerCase();
  const limit = params.limit ?? 20;

  const results = await Promise.all(
    orgs.map(async (org) => {
      const url = `https://api.lever.co/v0/postings/${encodeURIComponent(org)}?mode=json`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        console.warn(`Lever org "${org}" returned ${response.status}; skipping`);
        return [] as JobPosting[];
      }
      const postings = (await response.json()) as LeverPosting[] | { ok?: boolean };
      if (!Array.isArray(postings)) {
        console.warn(`Lever org "${org}" returned no postings; skipping`);
        return [] as JobPosting[];
      }
      const sections = (postings ?? [])
        .filter((posting) => {
          const haystack = `${posting.text} ${posting.categories?.team ?? ''} ${posting.categories?.department ?? ''}`.toLowerCase();
          return haystack.includes(query);
        })
        .map((posting): JobPosting => {
          const location = posting.categories?.location || 'Not specified';
          const commitment = posting.categories?.commitment?.toLowerCase() ?? '';
          return {
            id: `lever:${org}:${posting.id}`,
            source: 'lever',
            title: posting.text,
            company: org,
            location,
            remote: /remote/i.test(location),
            roleType: commitmentMap[commitment] ?? 'unknown',
            url: posting.hostedUrl,
            description: (posting.descriptionPlain ?? '').slice(0, 2000),
            postedAt: new Date(posting.createdAt).toISOString(),
          };
        });
      return sections;
    })
  );

  return results.flat().slice(0, limit);
}