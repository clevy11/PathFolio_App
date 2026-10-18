import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProfile } from '@/lib/services/profile';
import { buildCvDocx, cvAttachmentName } from '@/lib/services/apply/cv-document';
import { isEmailConfigured, sendEmail } from '@/lib/integrations/email';
import { createApplication, findDuplicateOpportunities } from '@/lib/services/tracker';

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({
  approved: z.literal(true),
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10_000),
  confirmDuplicate: z.boolean().optional(),
  job: z.object({
    title: z.string().min(1),
    company: z.string().min(1),
    url: z.string().url(),
    location: z.string().optional(),
    source: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body?.approved !== true) {
      return NextResponse.json(
        { error: 'Explicit approval is required before sending. Review the draft and approve it first.' },
        { status: 400 }
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'A valid recipient, subject and body are required' }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Sending is not configured. Set EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD and EMAIL_FROM.' },
        { status: 400 }
      );
    }

    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No master profile found.' }, { status: 400 });
    }

    const { job, to, subject, body: emailBody, confirmDuplicate } = parsed.data;

    if (!confirmDuplicate) {
      const duplicates = await findDuplicateOpportunities({
        title: job.title,
        organization: job.company,
        link: job.url,
      });
      if (duplicates.length > 0) {
        return NextResponse.json(
          { error: 'You already tracked this opportunity', duplicates },
          { status: 409 }
        );
      }
    }

    const cv = await buildCvDocx(profile);
    await sendEmail({
      to,
      subject,
      text: emailBody,
      replyTo: profile.email,
      attachments: [{ filename: cvAttachmentName(profile), content: cv }],
    });

    const application = await createApplication({
      opportunity: {
        type: 'job',
        title: job.title,
        organization: job.company,
        region: job.location ?? null,
        link: job.url,
        source: job.source ?? null,
      },
      application: {
        method: 'email',
        status: 'sent',
        dateApplied: new Date(),
        contactEmail: to,
        notes: `Sent from Pathfolio.\n\nTo: ${to}\nSubject: ${subject}\n\n${emailBody}`,
      },
    });

    return NextResponse.json({ applicationId: application.id, sentTo: to });
  } catch (error) {
    console.error('POST /api/jobs/send error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send the application';
    return NextResponse.json({ error: message.slice(0, 300) }, { status: 500 });
  }
}
