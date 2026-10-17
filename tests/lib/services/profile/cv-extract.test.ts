import { describe, it, expect } from 'vitest';
import {
  parseExtractionJson,
  normalizeExtraction,
  mergeSuggestedProfile,
  sectionsToSuggestedProfile,
} from '@/lib/services/profile/cv-extract';

describe('parseExtractionJson', () => {
  it('parses a plain JSON object', () => {
    expect(parseExtractionJson('{"name":"Ada"}')).toEqual({ name: 'Ada' });
  });

  it('strips markdown code fences', () => {
    expect(parseExtractionJson('```json\n{"name":"Ada"}\n```')).toEqual({ name: 'Ada' });
  });

  it('extracts the object when surrounded by commentary', () => {
    expect(parseExtractionJson('Here you go:\n{"name":"Ada"}\nDone.')).toEqual({ name: 'Ada' });
  });

  it('returns null for malformed or empty output', () => {
    expect(parseExtractionJson('no json here')).toBeNull();
    expect(parseExtractionJson('{ not valid }')).toBeNull();
  });
});

describe('normalizeExtraction', () => {
  it('drops blank strings and empty collections', () => {
    const profile = normalizeExtraction({ name: '  ', email: 'a@b.com', skills: [], experience: [] });
    expect(profile.name).toBeUndefined();
    expect(profile.email).toBe('a@b.com');
    expect(profile.skills).toBeUndefined();
    expect(profile.experience).toBeUndefined();
  });

  it('skips experience and education entries with no identifying text', () => {
    const profile = normalizeExtraction({
      experience: [{ company: '', role: '' }, { company: 'Acme', role: 'Engineer' }],
      education: [{ institution: '', degree: '' }, { institution: 'Uni', degree: 'BSc' }],
    });
    expect(profile.experience).toHaveLength(1);
    expect(profile.education).toHaveLength(1);
  });

  it('deduplicates skills', () => {
    const profile = normalizeExtraction({ skills: ['Java', 'Java', 'SQL'] });
    expect(profile.skills).toEqual(['Java', 'SQL']);
  });
});

describe('mergeSuggestedProfile', () => {
  it('prefers primary values and fills gaps from the fallback', () => {
    const merged = mergeSuggestedProfile(
      { name: 'Ada', skills: ['Java'] },
      { name: 'Fallback', email: 'a@b.com', skills: ['Old'], education: [{ institution: 'Uni', degree: 'BSc', field: 'CS', startDate: '', endDate: '' }] }
    );
    expect(merged.name).toBe('Ada');
    expect(merged.email).toBe('a@b.com');
    expect(merged.skills).toEqual(['Java']);
    expect(merged.education).toHaveLength(1);
  });
});

describe('sectionsToSuggestedProfile', () => {
  it('omits empty sections', () => {
    expect(sectionsToSuggestedProfile({ name: 'Ada' })).toEqual({ name: 'Ada' });
  });
});
