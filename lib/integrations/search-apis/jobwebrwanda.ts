import type { JobPosting, JobSearchParams } from './types';
import { inferRoleType } from './role-type';
import { parseDeadlineDate } from '@/lib/services/search/deadline';

const FEED_URL = 'https://jobwebrwanda.com/feed/';
const MAX_PAGES = 3;
const FEED_PAGE_SIZE = 10;
const USER_AGENT = 'Pathfolio/0.1 (+job search)';

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
}

function tag(item: string, name: string): string {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? stripCdata(match[1]).trim() : '';
}

function htmlToLines(html: string): string[] {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
  )
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function splitTitleAndCompany(title: string): { title: string; company: string } {
  const match = title.match(/^(.+)\s+at\s+(.+)$/i);
  if (!match) return { title: title.trim(), company: 'Not specified' };
  return { title: match[1].trim(), company: match[2].trim() };
}

function extractLocation(lines: string[]): string {
  const locationLine = lines.find((line) =>
    /^(location|duty station|place of work|work location|job location)\s*[:\-–]/i.test(line)
  );
  if (locationLine) {
    const value = locationLine.replace(/^[^:\-–]*[:\-–]\s*/, '').replace(/[.;,]+$/, '').trim();
    if (value.length >= 3 && value.length <= 80) return value;
  }
  const inline = lines.join(' ').match(/\b(?:based in|located in)\s+([A-Z][A-Za-z]+(?:,\s*[A-Z][A-Za-z ]+)?)/);
  if (inline) return inline[1].trim();
  return 'Rwanda';
}

export function parseJobwebRwandaFeed(xml: string): JobPosting[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  const jobs: JobPosting[] = [];

  for (const item of items) {
    const link = decodeEntities(tag(item, 'link'));
    const rawTitle = decodeEntities(tag(item, 'title'));
    if (!link || !rawTitle) continue;

    const { title, company } = splitTitleAndCompany(rawTitle);
    const html = tag(item, 'content:encoded') || tag(item, 'description');
    const lines = htmlToLines(html);
    const fullText = lines.join('\n');
    const description = fullText.slice(0, 6000);
    const deadline = parseDeadlineDate(fullText) ?? undefined;
    const location = extractLocation(lines);
    const posted = tag(item, 'pubDate');
    const postedDate = posted ? new Date(posted) : null;
    const slug = link.replace(/\/$/, '').split('/').pop() ?? link;

    jobs.push({
      id: `jobwebrwanda:${slug}`,
      source: 'jobwebrwanda',
      title,
      company,
      location,
      remote: /remote|work from home/i.test(location) || /remote/i.test(description.slice(0, 400)),
      roleType: inferRoleType(title, description.slice(0, 600)),
      url: link,
      description,
      postedAt: postedDate && !Number.isNaN(postedDate.getTime()) ? postedDate.toISOString() : undefined,
      deadline,
    });
  }

  return jobs;
}

/**
 * Jobweb Rwanda is a WordPress job board: its search feed returns the postings
 * that match a keyword, newest first, 10 per page.
 */
export async function searchJobwebRwanda(params: JobSearchParams): Promise<JobPosting[]> {
  const limit = params.limit ?? 20;
  const jobs: JobPosting[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(FEED_URL);
    if (params.query.trim()) url.searchParams.set('s', params.query.trim());
    if (page > 1) url.searchParams.set('paged', String(page));

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      // WordPress answers 404 once `paged` runs past the last feed page.
      if (page === 1) throw new Error(`Jobweb Rwanda feed returned ${response.status}`);
      break;
    }

    const parsed = parseJobwebRwandaFeed(await response.text());
    jobs.push(...parsed);
    const isLastPage = parsed.length < FEED_PAGE_SIZE;
    if (isLastPage || jobs.length >= limit) break;
  }

  const seen = new Set<string>();
  return jobs
    .filter((job) => {
      if (seen.has(job.url)) return false;
      seen.add(job.url);
      return true;
    })
    .slice(0, limit);
}
