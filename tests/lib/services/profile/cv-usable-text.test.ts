import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callLLM } from '@/lib/integrations/llm';
import { hasUsableCVText, MIN_CV_TEXT_LENGTH } from '@/lib/services/profile/cv-parser';
import { buildSuggestedProfile } from '@/lib/services/profile/cv-extract';

vi.mock('@/lib/integrations/llm', () => ({
  callLLM: vi.fn(),
  getDefaultModel: () => 'stub-model',
}));

const mockedCallLLM = vi.mocked(callLLM);

const realText =
  'CALEB LEVY BUNTU\nSoftware Engineer\nbuntulevycaleb@gmail.com\nSkills\nJava, Spring Boot, React\nExperience\nIrembo - Software Engineer';

describe('hasUsableCVText', () => {
  it('rejects the blank output of a scanned, image-only PDF', () => {
    expect(hasUsableCVText('\n\n\n\n\n\n')).toBe(false);
    expect(hasUsableCVText('   \n\t  ')).toBe(false);
  });

  it('rejects text shorter than the minimum', () => {
    expect(hasUsableCVText('a'.repeat(MIN_CV_TEXT_LENGTH - 1))).toBe(false);
    expect(hasUsableCVText('a'.repeat(MIN_CV_TEXT_LENGTH))).toBe(true);
  });

  it('accepts real CV text', () => {
    expect(hasUsableCVText(realText)).toBe(true);
  });
});

describe('buildSuggestedProfile guard', () => {
  beforeEach(() => {
    mockedCallLLM.mockReset();
  });

  it('skips the LLM entirely when the file has no readable text', async () => {
    const result = await buildSuggestedProfile('\n\n\n\n\n\n', {});
    expect(mockedCallLLM).not.toHaveBeenCalled();
    expect(result.source).toBe('heuristic');
  });

  it('does not claim AI output when the model returns only nulls', async () => {
    mockedCallLLM.mockResolvedValue({ text: '{"name":null,"skills":[],"experience":[]}' });
    const result = await buildSuggestedProfile(realText, {});
    expect(mockedCallLLM).toHaveBeenCalledOnce();
    expect(result.source).toBe('heuristic');
  });

  it('returns source ai when the model extracts real fields', async () => {
    mockedCallLLM.mockResolvedValue({ text: '{"name":"Caleb Levy Buntu","skills":["Java"]}' });
    const result = await buildSuggestedProfile(realText, {});
    expect(result.source).toBe('ai');
    expect(result.profile.name).toBe('Caleb Levy Buntu');
    expect(result.profile.skills).toEqual(['Java']);
  });

  it('keeps heuristic sections as a fallback for fields the model omitted', async () => {
    mockedCallLLM.mockResolvedValue({ text: '{"name":"Caleb Levy Buntu"}' });
    const result = await buildSuggestedProfile(realText, { email: 'buntulevycaleb@gmail.com' });
    expect(result.source).toBe('ai');
    expect(result.profile.email).toBe('buntulevycaleb@gmail.com');
  });
});
