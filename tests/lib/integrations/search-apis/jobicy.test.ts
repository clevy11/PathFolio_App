import { describe, it, expect, vi, afterEach } from 'vitest';
import { jobicyGeosForRegion, mapJobicyJob, searchJobicy } from '@/lib/integrations/search-apis/jobicy';
import { matchesQuery, expandToken } from '@/lib/integrations/search-apis/query-match';

afterEach(() => {
  vi.unstubAllGlobals();
});

const apiJob = {
  id: 1,
  url: 'https://jobicy.com/jobs/1',
  jobTitle: ' Backend Developer ',
  companyName: ' Acme ',
  jobGeo: 'Anywhere',
  jobType: ['Full-Time'],
  jobDescription: '<p>Java &amp; <b>Spring</b></p>',
  pubDate: '2026-10-18T07:23:20+00:00',
};

describe('mapJobicyJob', () => {
  it('maps an API job to a remote posting', () => {
    const job = mapJobicyJob(apiJob);
    expect(job).toMatchObject({
      id: 'jobicy:1',
      source: 'jobicy',
      title: 'Backend Developer',
      company: 'Acme',
      location: 'Anywhere',
      remote: true,
      roleType: 'full-time',
    });
    expect(job.description).toBe('Java & Spring');
    expect(job.postedAt).toBe('2026-10-18T07:23:20+00:00');
  });

  it('infers the role type when jobType is missing, and defaults the location', () => {
    const job = mapJobicyJob({ ...apiJob, jobType: undefined, jobGeo: '' });
    expect(job.roleType).toBe('unknown');
    expect(job.location).toBe('Anywhere');
  });
});

describe('jobicyGeosForRegion', () => {
  it('adds EMEA for African searches and falls back to anywhere', () => {
    expect(jobicyGeosForRegion('rwanda')).toEqual(['anywhere', 'emea']);
    expect(jobicyGeosForRegion('africa')).toEqual(['anywhere', 'emea']);
    expect(jobicyGeosForRegion('mars')).toEqual(['anywhere']);
  });
});

describe('searchJobicy', () => {
  it('queries every required geo and removes duplicate ids', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const job = { ...apiJob, id: url.searchParams.get('geo') === 'emea' ? 2 : 1 };
      return { ok: true, status: 200, json: async () => ({ jobs: [job] }) } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const jobs = await searchJobicy({ query: 'developer', limit: 10 }, { geo: ['anywhere', 'emea'] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = new URL(String(fetchMock.mock.calls[0][0]));
    expect(first.searchParams.get('tag')).toBe('developer');
    expect(first.searchParams.get('count')).toBe('10');
    expect(jobs.map((job) => job.id)).toEqual(['jobicy:1', 'jobicy:2']);
  });

  it('does not call the API without a query', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchJobicy({ query: '  ' })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on a failed response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429 }) as Response));
    await expect(searchJobicy({ query: 'developer' })).rejects.toThrow('Jobicy API returned 429');
  });
});

describe('matchesQuery', () => {
  it('matches every token and treats empty queries as a match', () => {
    expect(matchesQuery('Senior Backend Engineer', 'backend')).toBe(true);
    expect(matchesQuery('Senior Backend Engineer', 'backend python')).toBe(false);
    expect(matchesQuery('anything', '  ')).toBe(true);
  });

  it('uses synonyms so "developer" finds engineering titles', () => {
    expect(matchesQuery('Software Engineer II', 'developer')).toBe(true);
    expect(matchesQuery('Front-End Developer', 'frontend')).toBe(true);
    expect(matchesQuery('Office Manager', 'developer')).toBe(false);
    expect(expandToken('developer')).toContain('engineer');
    expect(expandToken('driver')).toEqual(['driver']);
    expect(expandToken('accountant')).toContain('accounting');
  });

  it('does not match inside another word', () => {
    expect(matchesQuery('algorithmic trading', 'go')).toBe(false);
  });
});
