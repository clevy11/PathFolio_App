import type { JobPosting, JobSearchParams } from './types';
import { inferRoleType } from './role-type';
import { matchesQuery } from './query-match';

const DEFAULT_BOARDS = ['stripe', 'github', 'figma', 'datadog'];

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  absolute_url: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
}

/**
 * Greenhouse has no global search — only per-company boards.
 * Searches a set of boards and merges the results.
 */
export async function searchGreenhouse(
  params: JobSearchParams,
  boards: string[] = DEFAULT_BOARDS
): Promise<JobPosting[]> {
  const query = params.query;
  const limit = params.limit ?? 20;

  const results = await Promise.all(
    boards.map(async (board) => {
      const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=false`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        console.warn(`Greenhouse board "${board}" returned ${response.status}; skipping`);
        return [] as JobPosting[];
      }
      const data = (await response.json()) as { jobs?: GreenhouseJob[] };
      return (data.jobs ?? [])
        .filter((job) =>
          matchesQuery(`${job.title} ${(job.departments ?? []).map((d) => d.name).join(' ')}`, query)
        )
        .map((job): JobPosting => ({
          id: `greenhouse:${board}:${job.id}`,
          source: 'greenhouse',
          title: job.title,
          company: board,
          location: job.location?.name || 'Not specified',
          remote: /remote/i.test(job.location?.name ?? ''),
          roleType: inferRoleType(job.title, job.departments?.map((d) => d.name).join(' ')),
          url: job.absolute_url,
          description: '',
          postedAt: job.updated_at,
        }));
    })
  );

  return results.flat().slice(0, limit);
}