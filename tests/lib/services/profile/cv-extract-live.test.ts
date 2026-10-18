import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { parseCV } from '@/lib/services/profile/cv-parser';
import { buildSuggestedProfile } from '@/lib/services/profile/cv-extract';

const CV_PATH = process.env.LIVE_CV_PATH || '/Users/mac/Downloads/Caleb_Levy_Buntu_CV.docx';
const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const runnable = Boolean(process.env.OPENROUTER_API_KEY) && existsSync(CV_PATH);

describe.skipIf(!runnable)('live full cv extraction probe', () => {
  it.skipIf(!runnable)('extracts with the free model', async () => {
    const buffer = readFileSync(CV_PATH);
    const parsed = await parseCV(buffer, MIME);
    console.log('rawText length:', parsed.rawText.length);

    const started = Date.now();
    const result = await buildSuggestedProfile(parsed.rawText, parsed.sections);
    console.log('source:', result.source, 'in', Date.now() - started, 'ms');
    console.log('counts:', {
      skills: result.profile.skills?.length,
      experience: result.profile.experience?.length,
      education: result.profile.education?.length,
      projects: result.profile.projects?.length,
      name: result.profile.name,
    });
    expect(result.source).toBe('ai');
  }, 240000);
});