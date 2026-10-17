import { NextRequest, NextResponse } from 'next/server';
import { deleteApplication, getApplication, updateApplication } from '@/lib/services/tracker';
import { updateApplicationSchema } from '@/lib/utils/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const application = await getApplication(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    console.error('GET /api/applications/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid application data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { dateApplied, followUpDate, ...rest } = parsed.data;
    const application = await updateApplication(id, {
      ...rest,
      ...(dateApplied !== undefined ? { dateApplied: dateApplied ? new Date(dateApplied) : null } : {}),
      ...(followUpDate !== undefined ? { followUpDate: followUpDate ? new Date(followUpDate) : null } : {}),
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    console.error('PATCH /api/applications/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const deleted = await deleteApplication(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/applications/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
