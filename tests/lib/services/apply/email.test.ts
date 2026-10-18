import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callLLM } from '@/lib/integrations/llm';
import { draftApplicationEmail, templateEmail } from '@/lib/services/apply/email';
import type { Profile } from '@/lib/db/schema';
import type { PostingDetails } from '@/lib/services/apply/extract';

vi.mock('@/lib/integrations/llm', () => ({ callLLM: vi.fn() }));

const mockCallLLM = vi.mocked(callLLM);

const profile = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Caleb Levy Buntu',
  email: 'caleb@example.com',
  phone: '+250 700 000 000',
  links: { GitHub: 'https://github.com/caleb' },
  summary: 'Backend developer with five years of experience building APIs in Node.js and Postgres.',
  skills: ['TypeScript', 'Node.js', 'Postgres', 'Docker'],
  education: [],
  experience: [],
  projects: [],
  savedAnswers: {},
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Profile;

const details: PostingDetails = {
  sourceUrl: 'https://acme.rw/jobs/1',
  fetched: true,
  emails: ['jobs@acme.rw'],
  applyUrls: [],
  documents: ['CV'],
  deadline: '30 June 2026',
  requirements: ['3 years of Node.js'],
  route: 'email',
};

const job = { title: 'Backend Developer', company: 'Acme', location: 'Kigali, Rwanda' };

beforeEach(() => {
  mockCallLLM.mockReset();
});

describe('templateEmail', () => {
  it('uses only profile and job facts', () => {
    const { subject, body } = templateEmail(profile, job);
    expect(subject).toBe('Application for Backend Developer — Caleb Levy Buntu');
    expect(body).toContain('Dear Acme hiring team,');
    expect(body).toContain('Backend Developer role in Kigali, Rwanda');
    expect(body).toContain(profile.summary);
    expect(body).toContain('TypeScript, Node.js, Postgres, Docker');
    expect(body).toContain(profile.email);
    expect(body).not.toMatch(/\[(company|your name|role)\]/i);
  });
});

describe('draftApplicationEmail', () => {
  it('returns the model draft and the contact email found on the posting', async () => {
    mockCallLLM.mockResolvedValue({
      text: '```json\n{"subject":"Application: Backend Developer","body":"Dear Acme team,\\n\\nI build Node.js APIs."}\n```',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const draft = await draftApplicationEmail(profile, job, details);
    expect(draft).toMatchObject({
      to: 'jobs@acme.rw',
      subject: 'Application: Backend Developer',
      body: 'Dear Acme team,\n\nI build Node.js APIs.',
      source: 'ai',
      prompt: 'application-email@1.0.0',
    });

    const prompt = mockCallLLM.mock.calls[0][0].prompt;
    expect(prompt).toContain('3 years of Node.js');
    expect(prompt).toContain(profile.summary);
    expect(prompt).toContain('Backend Developer');
  });

  it('never invents a recipient when the posting has no email', async () => {
    mockCallLLM.mockResolvedValue({ text: '{"subject":"Hi","body":"Hello"}' });
    const draft = await draftApplicationEmail(profile, job, { ...details, emails: [] });
    expect(draft.to).toBeNull();
  });

  it('falls back to the template when the model output has no JSON', async () => {
    mockCallLLM.mockResolvedValue({ text: 'I cannot help with that.' });
    const draft = await draftApplicationEmail(profile, job, details);
    expect(draft.source).toBe('template');
    expect(draft.warning).toContain('unusable draft');
    expect(draft.body).toContain('Backend Developer role in Kigali, Rwanda');
  });

  it('falls back to the template when the model call fails', async () => {
    mockCallLLM.mockRejectedValue(new Error('429 rate limited'));
    const draft = await draftApplicationEmail(profile, job, details);
    expect(draft.source).toBe('template');
    expect(draft.warning).toContain('429 rate limited');
    expect(draft.to).toBe('jobs@acme.rw');
  });
});
