import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProfile } from '@/lib/services/profile';
import { draftApplicationEmail } from '@/lib/services/apply/email';
import { extractPostingDetails, emptyPostingDetails } from '@/lib/services/apply/extract';
import { fetchPostingPage } from '@/lib/services/apply/fetch-posting';
import { cvAttachmentName } from '@/lib/services/apply/cv-document';
import { isEmailConfigured } from '@/lib/integrations/email';

export const runtime = 'nodejs';
export const maxDuration = 120;

const jobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  url: z.string().url(),
  location: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
});

const requestSchema = z.object({ job: jobSchema });

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'A job title, company and posting URL are required' }, { status: 400 });
    }

    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json(
        { error: 'No master profile yet. Upload or fill in your profile first so the email can quote real facts.' },
        { status: 400 }
      );
    }

    const job = parsed.data.job;
    const page = await fetchPostingPage(job.url);
    const details = page.ok
      ? extractPostingDetails(page.html, job.url)
      : emptyPostingDetails(job.url, page.error ?? 'Could not open the posting.');

    const email = await draftApplicationEmail(profile, job, details);

    return NextResponse.json({
      email,
      posting: details,
      attachment: cvAttachmentName(profile),
      emailConfigured: isEmailConfigured(),
    });
  } catch (error) {
    console.error('POST /api/jobs/prepare error:', error);
    return NextResponse.json({ error: 'Could not prepare the application' }, { status: 500 });
  }
}
