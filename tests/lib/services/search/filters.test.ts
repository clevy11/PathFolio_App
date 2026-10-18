import { describe, it, expect } from 'vitest';
import { matchesRegion, matchesRoleType, filterJobs, dedupeJobs } from '@/lib/services/search/filters';
import type { JobPosting } from '@/lib/integrations/search-apis/types';

function job(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    id: 'job-1',
    source: 'remotive',
    title: 'Backend Engineer',
    company: 'Acme',
    location: 'Kigali, Rwanda',
    remote: false,
    roleType: 'full-time',
    url: 'https://example.com/1',
    description: 'Java',
    ...overrides,
  };
}

describe('matchesRegion', () => {
  it('accepts everything for any', () => {
    expect(matchesRegion(job(), 'any')).toBe(true);
  });

  it('matches the remote flag for remote', () => {
    expect(matchesRegion(job({ remote: true }), 'remote')).toBe(true);
    expect(matchesRegion(job({ remote: false }), 'remote')).toBe(false);
  });

  it('matches region keywords in the location', () => {
    expect(matchesRegion(job({ location: 'New York, USA' }), 'united-states')).toBe(true);
    expect(matchesRegion(job({ location: 'London, UK' }), 'united-kingdom')).toBe(true);
    expect(matchesRegion(job({ location: 'Nairobi, Kenya' }), 'africa')).toBe(true);
    expect(matchesRegion(job({ location: 'Sydney, Australia' }), 'oceania')).toBe(true);
    expect(matchesRegion(job({ location: 'Berlin, Germany' }), 'europe')).toBe(true);
    expect(matchesRegion(job({ location: 'Toronto, Canada' }), 'canada')).toBe(true);
    expect(matchesRegion(job({ location: 'Singapore' }), 'asia')).toBe(true);
  });

  it('rejects a location outside the region', () => {
    expect(matchesRegion(job({ location: 'Kigali, Rwanda' }), 'europe')).toBe(false);
  });

  it('matches Rwanda and East African postings for the rwanda filter', () => {
    expect(matchesRegion(job({ location: 'Kigali, Rwanda' }), 'rwanda')).toBe(true);
    expect(matchesRegion(job({ location: 'Kampala, Uganda' }), 'rwanda')).toBe(false);
    expect(matchesRegion(job({ location: 'Kampala, Uganda' }), 'africa')).toBe(true);
    expect(matchesRegion(job({ location: 'Lagos, Nigeria' }), 'africa')).toBe(true);
  });

  it('treats worldwide remote roles as open to Rwanda', () => {
    expect(matchesRegion(job({ location: 'Worldwide', remote: true }), 'rwanda')).toBe(true);
    expect(matchesRegion(job({ location: 'Anywhere', remote: true }), 'africa')).toBe(true);
    expect(matchesRegion(job({ location: 'EMEA', remote: true }), 'rwanda')).toBe(true);
    expect(matchesRegion(job({ location: 'Worldwide', remote: false }), 'rwanda')).toBe(false);
  });

  it('does not leak non-African remote locations into the rwanda filter', () => {
    expect(matchesRegion(job({ location: 'Berlin, Germany', remote: true }), 'rwanda')).toBe(false);
    expect(matchesRegion(job({ location: 'Remote - USA', remote: true }), 'rwanda')).toBe(false);
  });
});

describe('matchesRoleType', () => {
  it('accepts everything for any', () => {
    expect(matchesRoleType(job({ roleType: 'unknown' }), 'any')).toBe(true);
  });

  it('requires an exact role type', () => {
    expect(matchesRoleType(job({ roleType: 'contract' }), 'contract')).toBe(true);
    expect(matchesRoleType(job({ roleType: 'contract' }), 'full-time')).toBe(false);
  });
});

describe('filterJobs', () => {
  it('applies region and role type together', () => {
    const jobs = [
      job({ id: 'a', location: 'Remote', remote: true, roleType: 'full-time' }),
      job({ id: 'b', location: 'Remote', remote: true, roleType: 'contract' }),
      job({ id: 'c', location: 'Berlin, Germany', remote: false, roleType: 'contract' }),
    ];
    const result = filterJobs(jobs, 'remote', 'contract');
    expect(result.map((j) => j.id)).toEqual(['b']);
  });
});

describe('dedupeJobs', () => {
  it('removes repeats of the same title and company, ignoring case and padding', () => {
    const jobs = [
      job({ id: 'a', title: ' Backend Engineer ', company: 'Acme' }),
      job({ id: 'b', title: 'backend engineer', company: 'acme' }),
      job({ id: 'c', title: 'Backend Engineer', company: 'Other' }),
    ];
    expect(dedupeJobs(jobs).map((j) => j.id)).toEqual(['a', 'c']);
  });
});
