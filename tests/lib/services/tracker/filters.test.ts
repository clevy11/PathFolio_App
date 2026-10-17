import { describe, it, expect } from 'vitest';
import {
  daysSince,
  matchesStaleFilter,
  parseApplicationFilters,
} from '@/lib/services/tracker/filters';

describe('parseApplicationFilters', () => {
  it('defaults to all statuses and no staleness filter', () => {
    expect(parseApplicationFilters(new URLSearchParams())).toEqual({ status: 'all', staleDays: null });
  });

  it('accepts a valid status', () => {
    expect(parseApplicationFilters(new URLSearchParams('status=sent')).status).toBe('sent');
  });

  it('ignores an unknown status', () => {
    expect(parseApplicationFilters(new URLSearchParams('status=banana')).status).toBe('all');
  });

  it('parses a positive integer staleDays', () => {
    expect(parseApplicationFilters(new URLSearchParams('staleDays=14')).staleDays).toBe(14);
  });

  it('rejects non-positive or non-numeric staleDays', () => {
    expect(parseApplicationFilters(new URLSearchParams('staleDays=0')).staleDays).toBeNull();
    expect(parseApplicationFilters(new URLSearchParams('staleDays=-3')).staleDays).toBeNull();
    expect(parseApplicationFilters(new URLSearchParams('staleDays=abc')).staleDays).toBeNull();
    expect(parseApplicationFilters(new URLSearchParams('staleDays=2.5')).staleDays).toBeNull();
  });
});

describe('daysSince', () => {
  it('counts whole days between two dates', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    expect(daysSince(new Date('2026-10-16T12:00:00Z'), now)).toBe(0);
    expect(daysSince(new Date('2026-10-02T12:00:00Z'), now)).toBe(14);
  });
});

describe('matchesStaleFilter', () => {
  const now = new Date('2026-10-16T12:00:00Z');

  it('passes everything when no staleness filter is set', () => {
    expect(matchesStaleFilter({ status: 'draft', dateApplied: null }, null, now)).toBe(true);
  });

  it('keeps a sent application older than the threshold', () => {
    expect(
      matchesStaleFilter({ status: 'sent', dateApplied: new Date('2026-10-01T12:00:00Z') }, 14, now)
    ).toBe(true);
  });

  it('drops a sent application newer than the threshold', () => {
    expect(
      matchesStaleFilter({ status: 'sent', dateApplied: new Date('2026-10-15T12:00:00Z') }, 14, now)
    ).toBe(false);
  });

  it('drops non-sent applications and sent applications without a date', () => {
    expect(
      matchesStaleFilter({ status: 'interview', dateApplied: new Date('2026-09-01T12:00:00Z') }, 14, now)
    ).toBe(false);
    expect(matchesStaleFilter({ status: 'sent', dateApplied: null }, 14, now)).toBe(false);
  });
});
