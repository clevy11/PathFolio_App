import type { JobPosting } from '@/lib/integrations/search-apis/types';

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const DEADLINE_KEYWORD =
  /(?:deadline|closing date|apply before|applications? (?:close|closing)(?:s| on| by)?|due date|submission deadline|apply not later than)\s*(?:is|on|by|:|-|–)?\s*([^\n]{0,90})/i;

function buildDate(year: number, month: number, day: number): Date | null {
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month, day, 23, 59, 59));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  return date;
}

export function parseDateInText(value: string): Date | null {
  const iso = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return buildDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const dayMonthYear = value.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/);
  if (dayMonthYear) return buildDate(Number(dayMonthYear[3]), Number(dayMonthYear[2]) - 1, Number(dayMonthYear[1]));

  const dayMonthName = value.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})\b/i);
  if (dayMonthName) {
    return buildDate(Number(dayMonthName[3]), MONTHS[dayMonthName[2].toLowerCase()], Number(dayMonthName[1]));
  }

  const monthNameDay = value.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (monthNameDay) {
    return buildDate(Number(monthNameDay[3]), MONTHS[monthNameDay[1].toLowerCase()], Number(monthNameDay[2]));
  }

  return null;
}

/** Reads a closing date only when the text labels it as a deadline. */
export function parseDeadlineDate(text: string): string | null {
  const match = text.match(DEADLINE_KEYWORD);
  if (!match) return null;
  const date = parseDateInText(match[1]);
  return date ? date.toISOString() : null;
}

/** A job without a stated deadline is treated as open (we never invent one). */
export function isOpen(job: Pick<JobPosting, 'deadline'>, now: Date = new Date()): boolean {
  if (!job.deadline) return true;
  const deadline = new Date(job.deadline);
  return Number.isNaN(deadline.getTime()) || deadline.getTime() >= now.getTime();
}

export function daysUntil(deadline: string, now: Date = new Date()): number | null {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  const days = (date.getTime() - now.getTime()) / 86_400_000;
  return days >= 0 ? Math.ceil(days) : Math.floor(days);
}
