import * as cheerio from 'cheerio';

export type ApplicationRoute = 'email' | 'form' | 'guided';

export interface PostingDetails {
  sourceUrl: string;
  fetched: boolean;
  error?: string;
  emails: string[];
  applyUrls: string[];
  documents: string[];
  deadline: string | null;
  requirements: string[];
  route: ApplicationRoute;
}

const BLOCKED_EMAIL_PATTERNS = [
  /\.(png|jpe?g|gif|svg|webp|css|js)$/i,
  /@(?:example|domain|email|sentry|wixpress|gravatar|wordpress|schema\.org|googletagmanager)\b/i,
  /^(?:no-?reply|donotreply)@/i,
  /@\d+x/i,
];

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export function extractEmails(text: string): string[] {
  const found = text.match(EMAIL_PATTERN) ?? [];
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const raw of found) {
    const email = raw.replace(/^[.,;:]+|[.,;:]+$/g, '').toLowerCase();
    if (BLOCKED_EMAIL_PATTERNS.some((pattern) => pattern.test(email))) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }
  return emails;
}

const DOCUMENT_PATTERNS: Array<[RegExp, string]> = [
  [/\bcover letter\b/i, 'Cover letter'],
  [/\b(application|motivation) letter\b/i, 'Application letter'],
  [/\b(cv|curriculum vitae|resume)\b/i, 'CV'],
  [/\b(transcripts?|academic records?)\b/i, 'Transcripts'],
  [/\b(degree|diploma|certificate)\b/i, 'Degree/certificate'],
  [/\b(recommendation|reference) letters?\b/i, 'Recommendation letter'],
  [/\b(national id|passport|id copy|identity card)\b/i, 'ID/passport copy'],
  [/\bportfolio\b/i, 'Portfolio'],
  [/\b(police clearance|criminal record)\b/i, 'Police clearance'],
];

const REQUIREMENT_HEADING =
  /^(requirements?|qualifications?|required skills|skills?( and experience)?|what you.?ll need|what we.?re looking for|who you are|about you|experience required|minimum requirements)\s*:?$/i;

const SECTION_STOP =
  /^(responsibilities|duties|benefits|how to apply|about (us|the company)|what we offer|compensation|salary|application process|deadline|closing date)\s*:?$/i;

function cleanLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

function toLines(text: string): string[] {
  return text
    .split('\n')
    .map(cleanLine)
    .filter((line) => line.length > 0);
}

function extractRequirements(lines: string[]): string[] {
  const start = lines.findIndex((line) => REQUIREMENT_HEADING.test(line.replace(/^[•\-*\s]+/, '')));
  if (start === -1) return [];

  const collected: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (SECTION_STOP.test(line)) break;
    if (REQUIREMENT_HEADING.test(line)) break;
    if (line.length < 3 || line.length > 400) continue;
    collected.push(line.replace(/^[•\-*\u2022]\s*/, ''));
    if (collected.length >= 12) break;
  }
  return collected;
}

function extractDeadline(text: string): string | null {
  const match = text.match(
    /(?:deadline|closing date|apply before|applications? (?:close|closing)|due date)\s*(?:is|:|-)?\s*([^\n]{3,60})/i
  );
  if (!match) return null;
  const value = cleanLine(match[1]).replace(/^[:\-–]\s*/, '');
  const dateMatch = value.match(
    /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i
  );
  return dateMatch ? dateMatch[0] : value.slice(0, 60);
}

function absoluteUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export function extractPostingDetails(html: string, sourceUrl: string): PostingDetails {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg').remove();

  const mailtoEmails: string[] = [];
  const applyUrls: string[] = [];
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href') ?? '';
    const label = cleanLine($(element).text());
    if (href.toLowerCase().startsWith('mailto:')) {
      mailtoEmails.push(href.replace(/^mailto:/i, '').split('?')[0]);
    }
    if (/apply|application|submit/i.test(href) || /^(apply|apply now|submit application)/i.test(label)) {
      const url = absoluteUrl(href, sourceUrl);
      if (url && !url.startsWith('mailto:') && !applyUrls.includes(url)) applyUrls.push(url);
    }
  });

  const withBreaks = ($('body').html() ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|dd|dt|section|article|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n\u2022 ')
    .replace(/<[^>]*>/g, ' ');

  const text = toLines(
    cheerio
      .load(`<div>${withBreaks}</div>`)
      .text()
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
  ).join('\n');

  // Some boards keep the description in an inline script (WordPress apply
  // forms do this), so the raw HTML is the last place we look for a contact.
  const rawWithBreaks = html.replace(/\\[rnt]/g, ' ').replace(/\\u[0-9a-f]{4}/gi, ' ');
  const emails = extractEmails([...mailtoEmails, text, rawWithBreaks].join(' '));
  const documents = DOCUMENT_PATTERNS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);

  let hasApplyForm = false;
  $('form').each((_, element) => {
    const label = `${$(element).text()} ${$(element).find('input[type="submit"]').attr('value') ?? ''}`;
    if (/apply|submit application/i.test(label)) hasApplyForm = true;
  });
  if (hasApplyForm && !applyUrls.includes(sourceUrl)) applyUrls.push(sourceUrl);

  return {
    sourceUrl,
    fetched: true,
    emails,
    applyUrls: applyUrls.slice(0, 5),
    documents,
    deadline: extractDeadline(text),
    requirements: extractRequirements(text.split('\n')),
    route: emails.length > 0 ? 'email' : applyUrls.length > 0 ? 'form' : 'guided',
  };
}

export function emptyPostingDetails(sourceUrl: string, error: string): PostingDetails {
  return {
    sourceUrl,
    fetched: false,
    error,
    emails: [],
    applyUrls: [],
    documents: [],
    deadline: null,
    requirements: [],
    route: 'guided',
  };
}
