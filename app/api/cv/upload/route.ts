import { NextRequest, NextResponse } from 'next/server';
import { parseCV } from '@/lib/services/profile/cv-parser';
import { profileSchema } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported. Use PDF, DOCX, or TXT.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseCV(buffer, file.type);

    const profileData = profileSchema.shape;
    const suggestedProfile: Record<string, unknown> = {};

    if (parsed.sections.name) suggestedProfile.name = parsed.sections.name;
    if (parsed.sections.email) suggestedProfile.email = parsed.sections.email;
    if (parsed.sections.phone) suggestedProfile.phone = parsed.sections.phone;
    if (parsed.sections.summary) suggestedProfile.summary = parsed.sections.summary;
    if (parsed.sections.skills?.length) suggestedProfile.skills = parsed.sections.skills;
    if (parsed.sections.education?.length) suggestedProfile.education = parsed.sections.education;
    if (parsed.sections.experience?.length) suggestedProfile.experience = parsed.sections.experience;
    if (parsed.sections.projects?.length) suggestedProfile.projects = parsed.sections.projects;

    return NextResponse.json({
      parsedCV: parsed,
      suggestedProfile,
      rawTextLength: parsed.rawText.length,
    });
  } catch (error) {
    console.error('POST /api/cv/upload error:', error);
    return NextResponse.json({ error: 'Failed to parse CV' }, { status: 500 });
  }
}