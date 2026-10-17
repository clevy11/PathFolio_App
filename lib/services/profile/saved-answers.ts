import { z } from 'zod';

export const savedAnswerSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(200, 'Question is too long'),
  answer: z.string().trim().min(1, 'Answer is required').max(2000, 'Answer is too long'),
});

export type SavedAnswer = z.infer<typeof savedAnswerSchema>;
export type SavedAnswers = Record<string, string>;

export function listSavedAnswers(answers: SavedAnswers | null | undefined): SavedAnswer[] {
  if (!answers) return [];
  return Object.entries(answers)
    .map(([question, answer]) => ({ question, answer }))
    .sort((a, b) => a.question.localeCompare(b.question));
}

export function setSavedAnswer(
  answers: SavedAnswers | null | undefined,
  input: SavedAnswer
): SavedAnswers {
  const { question, answer } = savedAnswerSchema.parse(input);
  return { ...(answers ?? {}), [question]: answer };
}

export function removeSavedAnswer(
  answers: SavedAnswers | null | undefined,
  question: string
): SavedAnswers {
  const next = { ...(answers ?? {}) };
  delete next[question];
  return next;
}
