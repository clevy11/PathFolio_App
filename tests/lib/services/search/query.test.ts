import { describe, it, expect } from 'vitest';
import { parseJobQuery } from '@/lib/services/search/query';

describe('parseJobQuery', () => {
  it('reads a location out of "role in place"', () => {
    expect(parseJobQuery('backend developer in Rwanda')).toEqual({ query: 'backend developer', region: 'rwanda' });
    expect(parseJobQuery('data analyst jobs in Kigali')).toEqual({ query: 'data analyst', region: 'rwanda' });
  });

  it('handles Africa and country names', () => {
    expect(parseJobQuery('accountant in Africa')).toEqual({ query: 'accountant', region: 'africa' });
    expect(parseJobQuery('sales manager in Kenya')).toEqual({ query: 'sales manager', region: 'africa' });
    expect(parseJobQuery('driver in South Africa')).toEqual({ query: 'driver', region: 'africa' });
  });

  it('keeps the region unset when no place is named', () => {
    expect(parseJobQuery('data analyst')).toEqual({ query: 'data analyst', region: null });
  });

  it('recognises remote searches', () => {
    expect(parseJobQuery('remote developer')).toEqual({ query: 'developer', region: 'remote' });
  });

  it('strips filler and trailing job words', () => {
    expect(parseJobQuery('show me developer jobs in Rwanda')).toEqual({ query: 'developer', region: 'rwanda' });
  });

  it('returns an empty role when the text is only a place', () => {
    expect(parseJobQuery('jobs in Rwanda')).toEqual({ query: '', region: 'rwanda' });
  });

  it('handles blank input', () => {
    expect(parseJobQuery('   ')).toEqual({ query: '', region: null });
  });
});
