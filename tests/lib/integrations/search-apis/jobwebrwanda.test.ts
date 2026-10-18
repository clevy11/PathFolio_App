import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseJobwebRwandaFeed, searchJobwebRwanda } from '@/lib/integrations/search-apis/jobwebrwanda';

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <item>
    <title>Backend Developer at Echowa Ltd</title>
    <link>https://jobwebrwanda.com/jobs/backend-developer-at-echowa/</link>
    <pubDate>Fri, 29 May 2026 09:46:19 +0000</pubDate>
    <description><![CDATA[<p>Short excerpt</p>]]></description>
    <content:encoded><![CDATA[
      <p><strong>Location: Kigali, Rwanda</strong></p>
      <p><strong>Contract Type: Permanent</strong></p>
      <p>We build APIs in Java &amp; Spring.</p>
      <p>Send your CV and cover letter to jobs@echowa.rw</p>
      <p>Deadline: 30 June 2026</p>
    ]]></content:encoded>
  </item>
  <item>
    <title>Communications Officer at Rwanda Men&#8217;s Resource Centre</title>
    <link>https://jobwebrwanda.com/jobs/communications-officer/</link>
    <pubDate>Wed, 24 Jun 2026 10:15:04 +0000</pubDate>
    <content:encoded><![CDATA[<p>Duty station: Kigali</p>]]></content:encoded>
  </item>
  <item>
    <title>Broken item without a link</title>
    <description>ignored</description>
  </item>
</channel>
</rss>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseJobwebRwandaFeed', () => {
  it('maps postings from the WordPress feed', () => {
    const jobs = parseJobwebRwandaFeed(feed);

    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      id: 'jobwebrwanda:backend-developer-at-echowa',
      source: 'jobwebrwanda',
      title: 'Backend Developer',
      company: 'Echowa Ltd',
      location: 'Kigali, Rwanda',
      url: 'https://jobwebrwanda.com/jobs/backend-developer-at-echowa/',
    });
    expect(jobs[0].description).toContain('Java & Spring');
    expect(jobs[0].description).not.toContain('<p>');
    expect(jobs[0].postedAt).toBe('2026-05-29T09:46:19.000Z');
    expect(jobs[0].deadline).toBe('2026-06-30T23:59:59.000Z');
  });

  it('decodes entities in titles and falls back to Rwanda for the location', () => {
    const job = parseJobwebRwandaFeed(feed)[1];
    expect(job.title).toBe('Communications Officer');
    expect(job.company).toContain('Rwanda Men’s Resource Centre');
    expect(job.location).toBe('Kigali');
  });

  it('queues the whole page and marks the feed as remote when it says so', () => {
    const [job] = parseJobwebRwandaFeed(
      `<rss><channel><item><title>Developer at Acme</title><link>https://x/1</link><content:encoded><![CDATA[<p>Location: Remote</p>]]></content:encoded></item></channel></rss>`
    );
    expect(job.remote).toBe(true);
  });

  it('returns nothing for a feed with no items', () => {
    expect(parseJobwebRwandaFeed('<rss><channel></channel></rss>')).toEqual([]);
  });
});

describe('searchJobwebRwanda', () => {
  it('searches the feed by keyword and pages until the limit is reached', async () => {
    const fullPage = Array.from({ length: 10 }, (_, index) =>
      `<item><title>Job ${index} at Acme</title><link>https://x/${index}</link><content:encoded><![CDATA[<p>Location: Kigali</p>]]></content:encoded></item>`
    ).join('');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const page = url.searchParams.get('paged');
      return {
        ok: true,
        status: 200,
        text: async () =>
          page === '2'
            ? `<rss><channel><item><title>Second at Acme</title><link>https://x/99</link><content:encoded><![CDATA[<p>Location: Huye</p>]]></content:encoded></item></channel></rss>`
            : `<rss><channel>${fullPage}</channel></rss>`,
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const jobs = await searchJobwebRwanda({ query: 'developer', limit: 15 });
    const firstUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(firstUrl.searchParams.get('s')).toBe('developer');
    expect(jobs).toHaveLength(11);
    expect(jobs[10].title).toBe('Second');
  });

  it('throws when the first feed page is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 }) as Response));
    await expect(searchJobwebRwanda({ query: 'developer' })).rejects.toThrow('Jobweb Rwanda feed returned 503');
  });

  it('stops when a later page returns 404 instead of discarding the results', async () => {
    const pageOne = Array.from({ length: 10 }, (_, index) =>
      `<item><title>Job ${index} at Acme</title><link>https://x/${index}</link><content:encoded><![CDATA[<p>Location: Kigali</p>]]></content:encoded></item>`
    ).join('');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const page = new URL(String(input)).searchParams.get('paged');
      if (page === '2') return { ok: false, status: 404 } as Response;
      return { ok: true, status: 200, text: async () => `<rss><channel>${pageOne}</channel></rss>` } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const jobs = await searchJobwebRwanda({ query: 'job', limit: 25 });
    expect(jobs).toHaveLength(10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
