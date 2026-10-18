export interface TailoringInput {
  profileText: string;
  jobDescription: string;
}

export interface CvExtractionInput {
  cvText: string;
}

export interface PromptTemplate<TInput = TailoringInput> {
  id: string;
  version: string;
  system: string;
  build: (input: TInput) => string;
}

export const CV_TAILORING_PROMPT: PromptTemplate = {
  id: 'cv-tailoring',
  version: '1.0.0',
  system: 'You are an expert CV writer. Only use provided profile data.',
  build: ({ profileText, jobDescription }) => `You are an expert CV writer. Given a master profile and a job description, create a tailored CV that highlights the most relevant experience and skills for the specific role.

Rules:
1. ONLY use information from the master profile - NEVER invent facts, skills, jobs, degrees, dates, or achievements
2. Reorder and rephrase existing experience to match the job requirements
3. Highlight matching skills and technologies
4. Keep the same structure but optimize content for the role
5. If something is not in the profile, don't include it
6. Return ONLY the tailored CV content in markdown format

Master Profile:
${profileText}

Job Description:
${jobDescription}

Return a tailored CV in markdown format.`,
};

export const COVER_LETTER_PROMPT: PromptTemplate = {
  id: 'cover-letter',
  version: '1.0.0',
  system: 'You are an expert cover letter writer. Only use provided profile data.',
  build: ({ profileText, jobDescription }) => `You are an expert cover letter writer. Given a master profile and a job description, write a compelling cover letter that connects the candidate's experience to the role.

Rules:
1. ONLY use information from the master profile - NEVER invent facts, contacts, or details
2. Address specific requirements mentioned in the job description
3. Show genuine interest and knowledge of the company/role
4. Keep it concise (3-4 paragraphs max)
5. Professional but personable tone
6. Return ONLY the cover letter content in markdown format

Master Profile:
${profileText}

Job Description:
${jobDescription}

Return a tailored cover letter in markdown format.`,
};

export interface ApplicationEmailInput {
  profileText: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements: string[];
}

export const APPLICATION_EMAIL_PROMPT: PromptTemplate<ApplicationEmailInput> = {
  id: 'application-email',
  version: '1.0.0',
  system: 'You write short job application emails using only the candidate profile.',
  build: ({ profileText, jobTitle, company, jobDescription, requirements }) => `Write a job application email.

Return ONLY a JSON object. No markdown, no code fences, no commentary:
{ "subject": string, "body": string }

Rules:
- Use ONLY facts in the candidate profile. Never invent skills, jobs, degrees, achievements, contacts, salaries, or dates.
- The body is plain text (no markdown), 120-180 words, addressed to the hiring team of the company.
- Say which role is being applied for and why the candidate fits it.
- If requirements are listed, address the most relevant ones using only profile evidence.
- Mention that the CV is attached.
- Sign off with the candidate's name from the profile.
- Never write placeholders such as [Company] or [Your Name].
- If a fact is missing from the profile, leave it out instead of guessing.

Role: ${jobTitle}
Company: ${company}

Requirements stated in the posting:
${requirements.length ? requirements.map((item) => `- ${item}`).join('\n') : 'Not stated.'}

Job description:
${jobDescription.slice(0, 4000)}

Candidate profile:
${profileText}`,
};

export const CV_EXTRACTION_PROMPT: PromptTemplate<CvExtractionInput> = {
  id: 'cv-extraction',
  version: '1.0.0',
  system: 'You convert CV text into structured JSON. Use only information present in the CV.',
  build: ({ cvText }) => `You extract structured profile data from a CV.

Return ONLY a JSON object. No markdown, no code fences, no commentary.

Use ONLY information written in the CV. Never invent or infer facts that are not present. If a value is missing, use "" (empty string) or [] (empty array).

JSON shape:
{
  "name": string,
  "email": string,
  "phone": string,
  "summary": string,
  "skills": string[],
  "links": { "label": "url" },
  "experience": [{ "company": string, "role": string, "startDate": string, "endDate": string, "description": string, "technologies": string[] }],
  "education": [{ "institution": string, "degree": string, "field": string, "startDate": string, "endDate": string, "description": string }],
  "projects": [{ "name": string, "description": string, "link": string, "technologies": string[] }]
}

Rules:
- skills: list individual skills only, NOT category labels such as "Programming Languages", "Backend Development", or "DevOps & Tools".
- Keep each experience/education/project entry separate; do not merge them.
- Dates: keep the text as written in the CV (for example "June 2025", "2024", "Present").
- description: join that entry's bullet points into a single paragraph.
- links: only URLs that appear in the CV (LinkedIn, GitHub, portfolio).
- Do not add skills, jobs, degrees, dates, or achievements that are not in the CV.

CV:
${cvText}`,
};

export const PROMPTS: PromptTemplate[] = [CV_TAILORING_PROMPT, COVER_LETTER_PROMPT];

export function reference(template: { id: string; version: string }): string {
  return `${template.id}@${template.version}`;
}
