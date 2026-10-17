import { describe, it, expect } from 'vitest';
import {
  COVER_LETTER_PROMPT,
  CV_TAILORING_PROMPT,
  PROMPTS,
  reference,
} from '@/lib/integrations/llm/prompts';

const input = {
  profileText: 'Name: Ada Lovelace\nSkills: TypeScript, Postgres',
  jobDescription: 'We are hiring a backend engineer to build APIs.',
};

describe('prompt templates', () => {
  it('builds a CV prompt containing the profile and the job description', () => {
    const prompt = CV_TAILORING_PROMPT.build(input);
    expect(prompt).toContain(input.profileText);
    expect(prompt).toContain(input.jobDescription);
  });

  it('builds a cover letter prompt containing the profile and the job description', () => {
    const prompt = COVER_LETTER_PROMPT.build(input);
    expect(prompt).toContain(input.profileText);
    expect(prompt).toContain(input.jobDescription);
  });

  it('keeps the never-invent rule in every prompt', () => {
    for (const template of PROMPTS) {
      expect(template.build(input)).toMatch(/NEVER invent/);
    }
  });

  it('exposes a stable id and semantic version for each prompt', () => {
    for (const template of PROMPTS) {
      expect(template.id).toBeTruthy();
      expect(template.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(template.system).toBeTruthy();
    }
  });

  it('formats a versioned reference', () => {
    expect(reference(CV_TAILORING_PROMPT)).toBe('cv-tailoring@1.0.0');
    expect(reference(COVER_LETTER_PROMPT)).toBe('cover-letter@1.0.0');
  });
});
