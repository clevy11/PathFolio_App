import { describe, it, expect } from 'vitest';
import { CSV_HEADERS, escapeCsvField, toCsv } from '@/lib/services/tracker/export';

const baseRow = {
  title: 'Backend Engineer',
  organization: 'Acme',
  region: 'EU',
  link: 'https://acme.test/jobs/1',
  method: 'email',
  status: 'sent',
  dateApplied: new Date('2026-10-01T00:00:00Z'),
  contactEmail: 'jobs@acme.test',
  followUpDate: null,
  notes: null,
};

describe('escapeCsvField', () => {
  it('returns an empty string for null and undefined', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('leaves plain values untouched', () => {
    expect(escapeCsvField('Acme')).toBe('Acme');
  });

  it('quotes values containing commas, quotes, or newlines', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('serializes dates as ISO strings', () => {
    expect(escapeCsvField(new Date('2026-10-01T00:00:00Z'))).toBe('2026-10-01T00:00:00.000Z');
  });
});

describe('toCsv', () => {
  it('writes a header row and one row per application', () => {
    const csv = toCsv([baseRow]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(CSV_HEADERS.join(','));
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Backend Engineer,Acme,EU,https://acme.test/jobs/1,email,sent');
  });

  it('renders empty fields for missing optional values', () => {
    const csv = toCsv([baseRow]);
    expect(csv.split('\r\n')[1].endsWith(',,')).toBe(true);
  });

  it('returns only the header for an empty list', () => {
    expect(toCsv([])).toBe(CSV_HEADERS.join(','));
  });
});
