import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchRemotive } from '@/lib/integrations/search-apis/remotive';
import { searchGreenhouse } from '@/lib/integrations/search-apis/greenhouse';
import { searchLever } from '@/lib/integrations/search-apis/lever';
import { searchAdzuna, isAdzunaConfigured } from '@/lib/integrations/search-apis/adzuna';
import { searchJooble, isJoobleConfigured } from '@/lib/integrations/search-apis/jooble';
import { inferRoleType } from '@/lib/integrations/search-apis/role-type';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ADZUNA_APP_ID;
  delete process.env.ADZUNA_APP_KEY;
  delete process.env.JOOBLE_API_KEY;
});

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('searchRemotive', () => {
  it('maps postings and strips HTML from the description', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          jobs: [
            {
              id: 1,
              title: 'Backend Engineer',
              company_name: 'Acme',
              candidate_required_location: 'Remote',
              job_type: 'full_time',
              url: 'https://example.com/1',
              description: '<p>Java &amp; <b>Spring</b></p>',
              publication_date: '2026-10-01T00:00:00Z',
            },
          ],
        })
      )
    );

    const [job] = await searchRemotive({ query: 'backend' });
    expect(job.id).toBe('remotive:1');
    expect(job.source).toBe('remotive');
    expect(job.remote).toBe(true);
    expect(job.roleType).toBe('full-time');
    expect(job.description).not.toContain('<');
    expect(job.description).toContain('Java');
  });

  it('accepts hyphenated job types', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          jobs: [
            {
              id: 2,
              title: 'Intern',
              company_name: 'Acme',
              candidate_required_location: 'Kigali, Rwanda',
              job_type: 'part-time',
              url: 'https://example.com/2',
              description: '',
              publication_date: '2026-10-01T00:00:00Z',
            },
          ],
        })
      )
    );

    const [job] = await searchRemotive({ query: 'intern' });
    expect(job.roleType).toBe('part-time');
    expect(job.remote).toBe(false);
  });

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 503)));
    await expect(searchRemotive({ query: 'x' })).rejects.toThrow('Remotive API returned 503');
  });
});

describe('searchGreenhouse', () => {
  it('keeps only titles matching the query and skips failing boards', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/bad/')) return jsonResponse({}, 500);
      if (url.includes('/good/')) {
        return jsonResponse({
          jobs: [
            { id: 10, title: 'Backend Engineer', updated_at: '2026-10-01', absolute_url: 'https://x/10', location: { name: 'Remote' } },
            { id: 11, title: 'Designer', updated_at: '2026-10-01', absolute_url: 'https://x/11', location: { name: 'Berlin' } },
          ],
        });
      }
      return jsonResponse({ jobs: [] });
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const jobs = await searchGreenhouse({ query: 'backend' }, ['good', 'bad']);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      id: 'greenhouse:good:10',
      company: 'good',
      remote: true,
      roleType: 'unknown',
    });
  });
});

describe('searchLever', () => {
  it('maps commitment, location and description', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse([
          {
            id: 'abc',
            text: 'Senior Backend Engineer',
            hostedUrl: 'https://lever/abc',
            categories: { location: 'Remote - Europe', commitment: 'Full-time' },
            createdAt: 1760000000000,
            descriptionPlain: 'Java and Spring',
          },
          { id: 'def', text: 'Office Manager', hostedUrl: 'https://lever/def', categories: { location: 'Paris' }, createdAt: 1760000000000 },
        ])
      )
    );

    const jobs = await searchLever({ query: 'engineer' }, ['acme']);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      id: 'lever:acme:abc',
      remote: true,
      roleType: 'full-time',
      description: 'Java and Spring',
    });
  });

  it('skips an org that returns a non-array payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ ok: false })));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(searchLever({ query: 'x' }, ['acme'])).resolves.toEqual([]);
  });
});

describe('searchAdzuna', () => {
  it('returns [] and reports unconfigured without credentials', async () => {
    expect(isAdzunaConfigured()).toBe(false);
    await expect(searchAdzuna({ query: 'java' })).resolves.toEqual([]);
  });

  it('sends credentials and maps results when configured', async () => {
    process.env.ADZUNA_APP_ID = 'id';
    process.env.ADZUNA_APP_KEY = 'key';
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => jsonResponse({ results: [
      {
        id: '42',
        title: ' Java Developer ',
        company: { display_name: 'Acme' },
        location: { display_name: 'Remote' },
        redirect_url: 'https://adzuna/42',
        description: 'Spring',
        created: 1760000000,
        contract_time: 'full_time',
      },
    ] }));
    vi.stubGlobal('fetch', fetchMock);

    const [job] = await searchAdzuna({ query: 'java' }, { region: 'gb' });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe('/v1/api/jobs/gb/search/1');
    expect(url.searchParams.get('what')).toBe('java');
    expect(job).toMatchObject({ id: 'adzuna:42', title: 'Java Developer', company: 'Acme', remote: true, roleType: 'full-time' });
  });
});

describe('searchJooble', () => {
  it('returns [] when no key is set', async () => {
    expect(isJoobleConfigured()).toBe(false);
    await expect(searchJooble({ query: 'java' })).resolves.toEqual([]);
  });

  it('posts keywords and region, then maps results', async () => {
    process.env.JOOBLE_API_KEY = 'secret';
    const fetchMock = vi.fn(async () => jsonResponse({ jobs: [
      { title: 'Java Developer', companyId: 'Acme', location: 'Kigali', snippet: '<b>Spring</b>', link: 'https://jooble/1', type: 'Full-time' },
    ] }));
    vi.stubGlobal('fetch', fetchMock);

    const [job] = await searchJooble({ query: 'java' }, { region: 'rw' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/secret');
    expect(JSON.parse(String(init.body))).toEqual({ keywords: 'java', region: 'rw' });
    expect(job).toMatchObject({ company: 'Acme', roleType: 'full-time', url: 'https://jooble/1' });
    expect(job.description).not.toContain('<b>');
  });
});

describe('inferRoleType', () => {
  it('detects common employment types from titles', () => {
    expect(inferRoleType('Software Engineering Intern')).toBe('internship');
    expect(inferRoleType('Backend Engineer (Contract)')).toBe('contract');
    expect(inferRoleType('Part-Time Designer')).toBe('part-time');
    expect(inferRoleType('Seasonal Support')).toBe('temporary');
    expect(inferRoleType('Full Time Engineer')).toBe('full-time');
  });

  it('returns unknown when nothing matches', () => {
    expect(inferRoleType('Backend Engineer')).toBe('unknown');
    expect(inferRoleType()).toBe('unknown');
  });
});
