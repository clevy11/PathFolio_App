import { describe, it, expect } from 'vitest';
import { scoreMatch } from '@/lib/services/search/match';
import type { JobPosting } from '@/lib/integrations/search-apis/types';

function job(title: string, description = ''): JobPosting {
  return {
    id: 'job-1',
    source: 'remotive',
    title,
    company: 'Acme',
    location: 'Remote',
    remote: true,
    roleType: 'full-time',
    url: 'https://example.com/1',
    description,
  };
}

describe('scoreMatch', () => {
  it('scores 100 when the posting only asks for skills in the profile', () => {
    const result = scoreMatch(job('React Developer', 'We need React and TypeScript'), ['React', 'TypeScript']);
    expect(result.score).toBe(100);
    expect(result.missingSkills).toEqual([]);
  });

  it('reports skills the posting asks for that the profile lacks', () => {
    const result = scoreMatch(job('Backend Engineer', 'Java, Spring Boot, Kubernetes and Docker'), ['Java']);
    expect(result.matchedSkills).toContain('java');
    expect(result.missingSkills).toEqual(expect.arrayContaining(['spring boot', 'kubernetes']));
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });

  it('returns 0 with no missing skills when the posting names nothing recognisable', () => {
    const result = scoreMatch(job('Chief of Staff', 'Stakeholder management and scheduling'), ['Java']);
    expect(result).toEqual({ score: 0, matchedSkills: [], missingSkills: [] });
  });

  it('is case-insensitive about profile skills', () => {
    const result = scoreMatch(job('Frontend', 'React experience required'), ['react']);
    expect(result.score).toBe(100);
  });

  it('matches on word boundaries, not substrings', () => {
    const go = scoreMatch(job('Engineer', 'Strong algorithms background'), ['Go']);
    expect(go.matchedSkills).not.toContain('go');

    const react = scoreMatch(job('Engineer', 'Reactive programming'), ['React']);
    expect(react.matchedSkills).not.toContain('react');
  });

  it('handles skills containing dots literally', () => {
    const result = scoreMatch(job('Engineer', 'Next.js and Node.js'), ['Next.js', 'Node.js']);
    expect(result.matchedSkills).toEqual(expect.arrayContaining(['next.js', 'node.js']));
    expect(result.score).toBe(100);
  });

  it('counts a skill once even when it appears repeatedly', () => {
    const result = scoreMatch(job('Engineer', 'React React React'), ['React']);
    expect(result.matchedSkills).toEqual(['react']);
    expect(result.score).toBe(100);
  });
});
