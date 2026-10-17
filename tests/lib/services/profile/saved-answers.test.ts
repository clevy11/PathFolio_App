import { describe, it, expect } from 'vitest';
import {
  listSavedAnswers,
  removeSavedAnswer,
  setSavedAnswer,
  savedAnswerSchema,
} from '@/lib/services/profile/saved-answers';

describe('listSavedAnswers', () => {
  it('returns an empty list for missing answers', () => {
    expect(listSavedAnswers(null)).toEqual([]);
    expect(listSavedAnswers(undefined)).toEqual([]);
    expect(listSavedAnswers({})).toEqual([]);
  });

  it('maps the record to a list sorted by question', () => {
    expect(listSavedAnswers({ 'Notice period': '4 weeks', 'Expected salary': '90k' })).toEqual([
      { question: 'Expected salary', answer: '90k' },
      { question: 'Notice period', answer: '4 weeks' },
    ]);
  });
});

describe('setSavedAnswer', () => {
  it('adds a new answer without mutating the original', () => {
    const original = { 'Expected salary': '90k' };
    const next = setSavedAnswer(original, { question: 'Notice period', answer: '4 weeks' });
    expect(next).toEqual({ 'Expected salary': '90k', 'Notice period': '4 weeks' });
    expect(original).toEqual({ 'Expected salary': '90k' });
  });

  it('overwrites an existing answer for the same question', () => {
    expect(setSavedAnswer({ 'Expected salary': '90k' }, { question: 'Expected salary', answer: '100k' })).toEqual({
      'Expected salary': '100k',
    });
  });

  it('trims whitespace around the question and answer', () => {
    expect(setSavedAnswer({}, { question: '  Remote?  ', answer: '  Yes  ' })).toEqual({ 'Remote?': 'Yes' });
  });

  it('accepts a missing starting record', () => {
    expect(setSavedAnswer(null, { question: 'Q', answer: 'A' })).toEqual({ Q: 'A' });
    expect(setSavedAnswer(undefined, { question: 'Q', answer: 'A' })).toEqual({ Q: 'A' });
  });

  it('rejects an empty question or a whitespace-only answer', () => {
    expect(() => setSavedAnswer({}, { question: '', answer: 'A' })).toThrow();
    expect(() => setSavedAnswer({}, { question: 'Q', answer: '   ' })).toThrow();
  });
});

describe('removeSavedAnswer', () => {
  it('removes the matching question without mutating the original', () => {
    const original = { 'Expected salary': '90k', 'Notice period': '4 weeks' };
    const next = removeSavedAnswer(original, 'Expected salary');
    expect(next).toEqual({ 'Notice period': '4 weeks' });
    expect(original).toEqual({ 'Expected salary': '90k', 'Notice period': '4 weeks' });
  });

  it('is a no-op for a missing question or a missing record', () => {
    expect(removeSavedAnswer({ A: '1' }, 'B')).toEqual({ A: '1' });
    expect(removeSavedAnswer(null, 'B')).toEqual({});
  });
});

describe('savedAnswerSchema', () => {
  it('accepts a valid answer', () => {
    expect(savedAnswerSchema.safeParse({ question: 'Q', answer: 'A' }).success).toBe(true);
  });

  it('rejects an empty question', () => {
    expect(savedAnswerSchema.safeParse({ question: '  ', answer: 'A' }).success).toBe(false);
  });

  it('rejects an answer longer than 2000 characters', () => {
    expect(savedAnswerSchema.safeParse({ question: 'Q', answer: 'x'.repeat(2001) }).success).toBe(false);
  });
});
