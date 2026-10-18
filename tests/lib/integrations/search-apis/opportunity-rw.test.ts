import { describe, it, expect, vi, afterEach } from 'vitest';
import { mapOpportunityRw, searchOpportunityRw } from '@/lib/integrations/search-apis/opportunity-rw';

const record = {
  id: '39ab1456-1447-43aa-ae11-8a372a0a412f',
  title_en: ' UI/UX Designer ',
  slug: 'uiux-designer-qt-software-ded2b4f5',
  description_en: '<p>Design <b>intuitive</b> interfaces.</p>',
  company_name: 'QT Software',
  location_en: 'Kigali, Rwanda',
  employment_type_en: 'full-time',
  skills: 'Figma, User Research',
  created_at: '2026-10-13T15:55:18.597Z',
  closing_date: '2026-10-22T00:00:00Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mapOpportunityRw', () => {
  it('maps a record into a scored-able posting with its deadline', () => {
    const job = mapOpportunityRw(record);
    expect(job).toMatchObject({
      id: 'opportunityrw:39ab1456-1447-43aa-ae11-8a372a0a412f',
      source: 'opportunityrw',
      title: 'UI/UX Designer',
      company: 'QT Software',
      location: 'Kigali, Rwanda',
      roleType: 'full-time',
      url: 'https://opportunity.ini.rw/en/opportunities/uiux-designer-qt-software-ded2b4f5',
      deadline: '2026-10-22T00:00:00Z',
      postedAt: '2026-10-13T15:55:18.597Z',
    });
    expect(job.description).toContain('Design intuitive interfaces.');
    expect(job.description).toContain('Skills: Figma, User Research');
  });

  it('handles missing optional fields', () => {
    const job = mapOpportunityRw({
      id: 'x',
      title_en: 'Driver',
      slug: 'driver',
      closing_date: null,
    });
    expect(job.company).toBe('Not specified');
    expect(job.location).toBe('Rwanda');
    expect(job.deadline).toBeUndefined();
    expect(job.roleType).toBe('unknown');
  });
});

describe('searchOpportunityRw', () => {
  it('filters the API records by keyword and respects the limit', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      ({
        ok: true,
        status: 200,
        json: async () => [
          record,
          { ...record, id: 'b', title_en: 'Accountant', description_en: 'Numbers', skills: 'Excel' },
        ],
      }) as Response
    );
    vi.stubGlobal('fetch', fetchMock);

    const jobs = await searchOpportunityRw({ query: 'designer', limit: 5 });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('type')).toBe('job');
    expect(url.searchParams.get('limit')).toBe('250');
    expect(jobs.map((job) => job.title)).toEqual(['UI/UX Designer']);
  });

  it('matches on skills and description, not only the title', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => [record] }) as Response)
    );
    const jobs = await searchOpportunityRw({ query: 'figma' });
    expect(jobs).toHaveLength(1);
  });

  it('throws when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 502 }) as Response));
    await expect(searchOpportunityRw({ query: 'developer' })).rejects.toThrow('opportunity.ini.rw API returned 502');
  });
});
