import { NextRequest, NextResponse } from 'next/server';
import { getProfile, upsertProfile } from '@/lib/services/profile';
import { profileSchema } from '@/lib/utils/validation';

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile data', details: parsed.error.flatten() }, { status: 400 });
    }

    const profile = await upsertProfile(parsed.data);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('POST /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to create/update profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
    }

    const parsed = profileSchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { updateProfile } = await import('@/lib/services/profile');
    const profile = await updateProfile(id, parsed.data);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}