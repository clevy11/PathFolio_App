import { NextRequest, NextResponse } from 'next/server';
import { listApplications } from '@/lib/services/tracker';
import { toCsv } from '@/lib/services/tracker/export';
import { parseApplicationFilters } from '@/lib/services/tracker/filters';

export async function GET(request: NextRequest) {
  try {
    const filters = parseApplicationFilters(new URL(request.url).searchParams);
    const applications = await listApplications(filters);

    const csv = toCsv(
      applications.map((item) => ({
        title: item.opportunity.title,
        organization: item.opportunity.organization,
        region: item.opportunity.region,
        link: item.opportunity.link,
        method: item.method,
        status: item.status,
        dateApplied: item.dateApplied,
        contactEmail: item.contactEmail,
        followUpDate: item.followUpDate,
        notes: item.notes,
      }))
    );

    const filename = `pathfolio-applications-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/applications/export error:', error);
    return NextResponse.json({ error: 'Failed to export applications' }, { status: 500 });
  }
}
