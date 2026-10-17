import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/services/profile';
import { callLLM, getDefaultModel } from '@/lib/integrations/llm';
import {
  COVER_LETTER_PROMPT,
  CV_TAILORING_PROMPT,
  reference,
} from '@/lib/integrations/llm/prompts';
import type { Profile } from '@/lib/db/schema';

function buildProfileText(profile: Profile): string {
  return `
Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone || 'Not provided'}
Summary: ${profile.summary || 'Not provided'}
Skills: ${profile.skills.join(', ') || 'None listed'}
Experience: ${profile.experience.map(e => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.description}`).join('\n') || 'None listed'}
Education: ${profile.education.map(e => `${e.degree} in ${e.field} at ${e.institution} (${e.startDate} - ${e.endDate})`).join('\n') || 'None listed'}
Projects: ${profile.projects.map(p => `${p.name}: ${p.description}`).join('\n') || 'None listed'}
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json({ error: 'Job description required' }, { status: 400 });
    }

    const profile = await getProfile();

    if (!profile) {
      return NextResponse.json({ error: 'No profile found. Please create a profile first.' }, { status: 400 });
    }

    const profileText = buildProfileText(profile);
    const model = getDefaultModel();

    const [cvResult, coverResult] = await Promise.all([
      callLLM({
        model,
        systemPrompt: CV_TAILORING_PROMPT.system,
        prompt: CV_TAILORING_PROMPT.build({ profileText, jobDescription }),
        temperature: 0.3,
        maxTokens: 3000,
      }),
      callLLM({
        model,
        systemPrompt: COVER_LETTER_PROMPT.system,
        prompt: COVER_LETTER_PROMPT.build({ profileText, jobDescription }),
        temperature: 0.4,
        maxTokens: 2000,
      }),
    ]);

    return NextResponse.json({
      tailoredCV: cvResult.text,
      coverLetter: coverResult.text,
      source: profileText,
      model,
      prompts: {
        cv: reference(CV_TAILORING_PROMPT),
        coverLetter: reference(COVER_LETTER_PROMPT),
      },
      usage: {
        cv: cvResult.usage,
        coverLetter: coverResult.usage,
      },
    });
  } catch (error) {
    console.error('Tailor API error:', error);
    return NextResponse.json({ error: 'Failed to generate tailored documents' }, { status: 500 });
  }
}
