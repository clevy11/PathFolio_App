import { describe, it, expect } from 'vitest';
import {
  getDuplicateMatches,
  normalizeLink,
  normalizeText,
} from '@/lib/services/tracker/dedupe';

const existing = [
  { id: '1', title: 'Backend Engineer', organization: 'Acme', link: 'https://acme.test/jobs/1' },
  { id: '2', title: 'Designer', organization: 'Globex', link: 'https://globex.test/roles/ux' },
];

describe('normalizeText / normalizeLink', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeText('  Backend   Engineer ')).toBe('backend engineer');
  });

  it('lowercases links and strips trailing slashes', () => {
    expect(normalizeLink('HTTPS://ACME.test/jobs/1/')).toBe('https://acme.test/jobs/1');
    expect(normalizeLink(null)).toBe('');
  });
});

describe('getDuplicateMatches', () => {
  it('matches on the same role at the same organization, ignoring case and spacing', () => {
    const matches = getDuplicateMatches(
      { title: 'backend  engineer', organization: 'ACME', link: null },
      existing
    );
    expect(matches.map((m) => m.id)).toEqual(['1']);
  });

  it('matches on the same link even when the title differs', () => {
    const matches = getDuplicateMatches(
      { title: 'Something Else', organization: 'Other', link: 'https://acme.test/jobs/1/' },
      existing
    );
    expect(matches.map((m) => m.id)).toEqual(['1']);
  });

  it('returns nothing for a genuinely new opportunity', () => {
    expect(
      getDuplicateMatches({ title: 'Data Engineer', organization: 'Initech', link: 'https://initech.test/1' }, existing)
    ).toEqual([]);
  });

  it('does not match on empty links or empty titles', () => {
    expect(getDuplicateMatches({ title: 'X', organization: 'Y', link: '' }, existing)).toEqual([]);
  });
});
