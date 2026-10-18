import { describe, it, expect } from 'vitest';
import { daysUntil, isOpen, parseDateInText, parseDeadlineDate } from '@/lib/services/search/deadline';

describe('parseDeadlineDate', () => {
  it('reads day-month-name deadlines', () => {
    expect(parseDeadlineDate('Deadline: 22 October 2026')).toBe('2026-10-22T23:59:59.000Z');
    expect(parseDeadlineDate('Application deadline is 3 Jun 2026')).toBe('2026-06-03T23:59:59.000Z');
  });

  it('reads month-name, ISO and day/month/year formats', () => {
    expect(parseDeadlineDate('Closing date: June 30, 2026')).toBe('2026-06-30T23:59:59.000Z');
    expect(parseDeadlineDate('closing date 2026-10-22')).toBe('2026-10-22T23:59:59.000Z');
    expect(parseDeadlineDate('Applications close on 30/06/2026')).toBe('2026-06-30T23:59:59.000Z');
    expect(parseDeadlineDate('Apply before 01/11/2026')).toBe('2026-11-01T23:59:59.000Z');
  });

  it('ignores dates that are not labelled as a deadline', () => {
    expect(parseDeadlineDate('Founded in 2019, we build APIs.')).toBeNull();
    expect(parseDeadlineDate('Deadline: as soon as possible')).toBeNull();
  });

  it('rejects impossible dates', () => {
    expect(parseDateInText('31/02/2026')).toBeNull();
    expect(parseDeadlineDate('Deadline: 2026-13-40')).toBeNull();
  });
});

describe('isOpen', () => {
  const now = new Date('2026-10-18T12:00:00Z');

  it('keeps jobs without a stated deadline', () => {
    expect(isOpen({}, now)).toBe(true);
  });

  it('keeps jobs whose deadline has not passed', () => {
    expect(isOpen({ deadline: '2026-10-22T23:59:59.000Z' }, now)).toBe(true);
  });

  it('drops jobs past their deadline', () => {
    expect(isOpen({ deadline: '2026-10-17T23:59:59.000Z' }, now)).toBe(false);
    expect(isOpen({ deadline: '2026-10-18T11:59:59.000Z' }, now)).toBe(false);
  });

  it('treats an unparseable deadline as open', () => {
    expect(isOpen({ deadline: 'not a date' }, now)).toBe(true);
  });
});

describe('daysUntil', () => {
  it('counts whole days to the deadline', () => {
    const now = new Date('2026-10-18T12:00:00Z');
    expect(daysUntil('2026-10-22T23:59:59.000Z', now)).toBe(5);
    expect(daysUntil('2026-10-17T23:59:59.000Z', now)).toBe(-1);
    expect(daysUntil('nope', now)).toBeNull();
  });
});
