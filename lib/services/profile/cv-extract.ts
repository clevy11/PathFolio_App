import { z } from 'zod';
import { callLLM, getDefaultModel } from '@/lib/integrations/llm';
import { CV_EXTRACTION_PROMPT } from '@/lib/integrations/llm/prompts';
import type { ParsedCVSections } from './cv-parser';

export interface SuggestedProfile {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  links?: Record<string, string>;
  experience?: NonNullable<ParsedCVSections['experience']>;
  education?: NonNullable<ParsedCVSections['education']>;
  projects?: NonNullable<ParsedCVSections['projects']>;
}

const nullableString = z.string().nullish();

const extractionSchema = z.object({
  name: nullableString,
  email: nullableString,
  phone: nullableString,
  summary: nullableString,
  skills: z.array(z.string()).nullish(),
  links: z.record(z.string().nullish()).nullish(),
  experience: z
    .array(
      z.object({
        company: nullableString,
        role: nullableString,
        startDate: nullableString,
        endDate: nullableString,
        description: nullableString,
        technologies: z.array(z.string()).nullish(),
      })
    )
    .nullish(),
  education: z
    .array(
      z.object({
        institution: nullableString,
        degree: nullableString,
        field: nullableString,
        startDate: nullableString,
        endDate: nullableString,
        description: nullableString,
      })
    )
    .nullish(),
  projects: z
    .array(
      z.object({
        name: nullableString,
        description: nullableString,
        link: nullableString,
        technologies: z.array(z.string()).nullish(),
      })
    )
    .nullish(),
});

type Extraction = z.infer<typeof extractionSchema>;

export function parseExtractionJson(text: string): unknown {
  const withoutFences = text.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(withoutFences.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clean(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeExtraction(data: Extraction): SuggestedProfile {
  const profile: SuggestedProfile = {};

  const name = clean(data.name);
  if (name) profile.name = name;
  const email = clean(data.email);
  if (email) profile.email = email;
  const phone = clean(data.phone);
  if (phone) profile.phone = phone;
  const summary = clean(data.summary);
  if (summary) profile.summary = summary;

  const skills = Array.from(new Set((data.skills ?? []).map((skill) => skill.trim()).filter(Boolean)));
  if (skills.length > 0) profile.skills = skills;

  if (data.links) {
    const links = Object.fromEntries(
      Object.entries(data.links)
        .map(([label, url]) => [label.trim(), url?.trim() ?? ''])
        .filter(([label, url]) => label && url)
    );
    if (Object.keys(links).length > 0) profile.links = links;
  }

  const experience = (data.experience ?? [])
    .map((item) => ({
      company: item.company?.trim() ?? '',
      role: item.role?.trim() ?? '',
      startDate: item.startDate?.trim() ?? '',
      endDate: item.endDate?.trim() ?? '',
      description: item.description?.trim() ?? '',
      ...(item.technologies?.length
        ? { technologies: item.technologies.map((tech) => tech.trim()).filter(Boolean) }
        : {}),
    }))
    .filter((item) => item.company || item.role);
  if (experience.length > 0) profile.experience = experience;

  const education = (data.education ?? [])
    .map((item) => ({
      institution: item.institution?.trim() ?? '',
      degree: item.degree?.trim() ?? '',
      field: item.field?.trim() ?? '',
      startDate: item.startDate?.trim() ?? '',
      endDate: item.endDate?.trim() ?? '',
      ...(item.description?.trim() ? { description: item.description.trim() } : {}),
    }))
    .filter((item) => item.institution || item.degree);
  if (education.length > 0) profile.education = education;

  const projects = (data.projects ?? [])
    .map((item) => ({
      name: item.name?.trim() ?? '',
      description: item.description?.trim() ?? '',
      ...(item.link?.trim() ? { link: item.link.trim() } : {}),
      ...(item.technologies?.length
        ? { technologies: item.technologies.map((tech) => tech.trim()).filter(Boolean) }
        : {}),
    }))
    .filter((item) => item.name);
  if (projects.length > 0) profile.projects = projects;

  return profile;
}

export function sectionsToSuggestedProfile(sections: ParsedCVSections): SuggestedProfile {
  const profile: SuggestedProfile = {};
  if (sections.name) profile.name = sections.name;
  if (sections.email) profile.email = sections.email;
  if (sections.phone) profile.phone = sections.phone;
  if (sections.summary) profile.summary = sections.summary;
  if (sections.skills?.length) profile.skills = sections.skills;
  if (sections.links && Object.keys(sections.links).length > 0) profile.links = sections.links;
  if (sections.experience?.length) profile.experience = sections.experience;
  if (sections.education?.length) profile.education = sections.education;
  if (sections.projects?.length) profile.projects = sections.projects;
  return profile;
}

export function mergeSuggestedProfile(primary: SuggestedProfile, fallback: SuggestedProfile): SuggestedProfile {
  return {
    name: primary.name ?? fallback.name,
    email: primary.email ?? fallback.email,
    phone: primary.phone ?? fallback.phone,
    summary: primary.summary ?? fallback.summary,
    skills: primary.skills?.length ? primary.skills : fallback.skills,
    links: { ...fallback.links, ...primary.links },
    experience: primary.experience?.length ? primary.experience : fallback.experience,
    education: primary.education?.length ? primary.education : fallback.education,
    projects: primary.projects?.length ? primary.projects : fallback.projects,
  };
}

export async function buildSuggestedProfile(
  rawText: string,
  sections: ParsedCVSections
): Promise<{ profile: SuggestedProfile; source: 'ai' | 'heuristic' }> {
  const fallback = sectionsToSuggestedProfile(sections);

  try {
    const result = await callLLM({
      model: getDefaultModel(),
      systemPrompt: CV_EXTRACTION_PROMPT.system,
      prompt: CV_EXTRACTION_PROMPT.build({ cvText: rawText.slice(0, 16000) }),
      temperature: 0.1,
      // Free reasoning models spend most of the budget on hidden reasoning tokens;
      // 2300 truncated the visible JSON (finish_reason: length) and broke validation.
      maxTokens: 8000,
    });

    const parsed = extractionSchema.safeParse(parseExtractionJson(result.text));
    if (parsed.success) {
      return { profile: mergeSuggestedProfile(normalizeExtraction(parsed.data), fallback), source: 'ai' };
    }
    console.warn('LLM CV extraction failed validation; using heuristic parser:', JSON.stringify(parsed.error.issues.slice(0, 3)));
  } catch (error) {
    console.warn('LLM CV extraction failed; using heuristic parser:', error);
  }

  return { profile: fallback, source: 'heuristic' };
}
