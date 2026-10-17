import { NextRequest, NextResponse } from 'next/server';
import { parseCV } from '@/lib/services/profile/cv-parser';
import { buildSuggestedProfile } from '@/lib/services/profile/cv-extract';

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
    const { profile: suggestedProfile, source } = await buildSuggestedProfile(
      parsed.rawText,
      parsed.sections
    );

    return NextResponse.json({
      parsedCV: parsed,
      suggestedProfile,
      source,
      rawTextLength: parsed.rawText.length,
    });
  } catch (error) {
    console.error('POST /api/cv/upload error:', error);
    return NextResponse.json({ error: 'Failed to parse CV' }, { status: 500 });
  }
}
