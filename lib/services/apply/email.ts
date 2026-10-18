import type { Profile } from '@/lib/db/schema';
import { callLLM } from '@/lib/integrations/llm';
import { APPLICATION_EMAIL_PROMPT, reference } from '@/lib/integrations/llm/prompts';
import { buildProfileText } from '@/lib/services/profile/text';
import type { PostingDetails } from './extract';

export interface DraftInput {
  title: string;
  company: string;
  location?: string;
  description?: string;
}

export interface DraftedEmail {
  to: string | null;
  subject: string;
  body: string;
  source: 'ai' | 'template';
  prompt?: string;
  warning?: string;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function templateEmail(profile: Profile, job: DraftInput): { subject: string; body: string } {
  const summary = (profile.summary ?? '').trim();
  const skills = profile.skills.slice(0, 6).join(', ');
  const contact = [profile.email, profile.phone].filter(Boolean).join(' · ');

  const body = [
    `Dear ${job.company} hiring team,`,
    '',
    `I am applying for the ${job.title} role${job.location ? ` in ${job.location}` : ''} at ${job.company}.`,
    summary ? summary : '',
    skills ? `My most relevant skills are ${skills}.` : '',
    'I have attached my CV and would welcome the chance to discuss how I can contribute to your team.',
    '',
    'Kind regards,',
    profile.name,
    contact,
  ]
    .filter((line) => line !== '')
    .join('\n');

  return { subject: `Application for ${job.title} — ${profile.name}`, body };
}

/**
 * Drafts the application email. Falls back to a truthful template when the LLM
 * is unavailable, so the user still gets an editable draft.
 */
export async function draftApplicationEmail(
  profile: Profile,
  job: DraftInput,
  details: PostingDetails
): Promise<DraftedEmail> {
  const to = details.emails[0] ?? null;
  const jobDescription = job.description?.trim() || '';

  try {
    const result = await callLLM({
      systemPrompt: APPLICATION_EMAIL_PROMPT.system,
      prompt: APPLICATION_EMAIL_PROMPT.build({
        profileText: buildProfileText(profile),
        jobTitle: job.title,
        company: job.company,
        jobDescription,
        requirements: details.requirements,
      }),
      temperature: 0.4,
      maxTokens: 1500,
    });

    const parsed = parseJsonObject(result.text);
    const subject = asText(parsed?.subject);
    const body = asText(parsed?.body);
    if (subject && body) {
      return { to, subject, body, source: 'ai', prompt: reference(APPLICATION_EMAIL_PROMPT) };
    }
    const fallback = templateEmail(profile, job);
    return {
      ...fallback,
      to,
      source: 'template',
      warning: 'The model returned an unusable draft, so this is the offline template.',
    };
  } catch (error) {
    const fallback = templateEmail(profile, job);
    return {
      ...fallback,
      to,
      source: 'template',
      warning: `Model unavailable (${error instanceof Error ? error.message.slice(0, 120) : 'unknown error'}); this is the offline template.`,
    };
  }
}
