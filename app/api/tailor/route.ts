import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/services/profile';
import { callLLM, getDefaultModel } from '@/lib/integrations/llm';

const CV_TAILORING_PROMPT = `You are an expert CV writer. Given a master profile and a job description, create a tailored CV that highlights the most relevant experience and skills for the specific role.

Rules:
1. ONLY use information from the master profile - NEVER invent facts, skills, jobs, degrees, dates, or achievements
2. Reorder and rephrase existing experience to match the job requirements
3. Highlight matching skills and technologies
4. Keep the same structure but optimize content for the role
5. If something is not in the profile, don't include it
6. Return ONLY the tailored CV content in markdown format

Master Profile:
{profile}

Job Description:
{jobDescription}

Return a tailored CV in markdown format.`;

const COVER_LETTER_PROMPT = `You are an expert cover letter writer. Given a master profile and a job description, write a compelling cover letter that connects the candidate's experience to the role.

Rules:
1. ONLY use information from the master profile - NEVER invent facts, contacts, or details
2. Address specific requirements mentioned in the job description
3. Show genuine interest and knowledge of the company/role
4. Keep it concise (3-4 paragraphs max)
5. Professional but personable tone
6. Return ONLY the cover letter content in markdown format

Master Profile:
{profile}

Job Description:
{jobDescription}

Return a tailored cover letter in markdown format.`;

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

    const profileText = `
Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone || 'Not provided'}
Summary: ${profile.summary || 'Not provided'}
Skills: ${profile.skills?.join(', ') || 'None listed'}
Experience: ${profile.experience?.map(e => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.description}`).join('\n') || 'None listed'}
Education: ${profile.education?.map(e => `${e.degree} in ${e.field} at ${e.institution} (${e.startDate} - ${e.endDate})`).join('\n') || 'None listed'}
Projects: ${profile.projects?.map(p => `${p.name}: ${p.description}`).join('\n') || 'None listed'}
`.trim();

    const model = getDefaultModel();

    const [cvResult, coverResult] = await Promise.all([
      callLLM({
        model,
        systemPrompt: 'You are an expert CV writer. Only use provided profile data.',
        prompt: CV_TAILORING_PROMPT.replace('{profile}', profileText).replace('{jobDescription}', jobDescription),
        temperature: 0.3,
        maxTokens: 3000,
      }),
      callLLM({
        model,
        systemPrompt: 'You are an expert cover letter writer. Only use provided profile data.',
        prompt: COVER_LETTER_PROMPT.replace('{profile}', profileText).replace('{jobDescription}', jobDescription),
        temperature: 0.4,
        maxTokens: 2000,
      }),
    ]);

    return NextResponse.json({
      tailoredCV: cvResult.text,
      coverLetter: coverResult.text,
      model,
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