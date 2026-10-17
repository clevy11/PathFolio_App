import { NextRequest, NextResponse } from 'next/server';
import {
  createApplication,
  findDuplicateOpportunities,
  listApplications,
} from '@/lib/services/tracker';
import { parseApplicationFilters } from '@/lib/services/tracker/filters';
import { createApplicationSchema } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const filters = parseApplicationFilters(new URL(request.url).searchParams);
    const applications = await listApplications(filters);
    return NextResponse.json({ applications });
  } catch (error) {
    console.error('GET /api/applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid application data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { opportunity, application, confirmDuplicate } = parsed.data;

    if (!confirmDuplicate) {
      const duplicates = await findDuplicateOpportunities({
        title: opportunity.title,
        organization: opportunity.organization,
        link: opportunity.link,
      });
      if (duplicates.length > 0) {
        return NextResponse.json({ error: 'Possible duplicate application', duplicates }, { status: 409 });
      }
    }

    const created = await createApplication({
      opportunity: {
        type: opportunity.type,
        title: opportunity.title,
        organization: opportunity.organization,
        region: opportunity.region ?? null,
        link: opportunity.link || null,
        deadline: opportunity.deadline ? new Date(opportunity.deadline) : null,
        source: opportunity.source ?? null,
        requirements: opportunity.requirements ?? null,
      },
      application: {
        method: application.method,
        status: application.status,
        dateApplied: application.dateApplied
          ? new Date(application.dateApplied)
          : application.status === 'draft'
            ? null
            : new Date(),
        contactEmail: application.contactEmail ?? null,
        notes: application.notes ?? null,
        followUpDate: application.followUpDate ? new Date(application.followUpDate) : null,
      },
    });

    return NextResponse.json({ application: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/applications error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
