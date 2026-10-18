import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/services/profile';
import { searchJobs, type RegionFilter, type RoleTypeFilter } from '@/lib/services/search';
import { parseJobQuery } from '@/lib/services/search/query';

const regions = [
  'any',
  'remote',
  'rwanda',
  'africa',
  'united-states',
  'europe',
  'united-kingdom',
  'canada',
  'asia',
  'oceania',
];
const roleTypes = ['any', 'full-time', 'contract', 'part-time', 'internship', 'temporary', 'unknown'];

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const rawQuery = (params.get('q') ?? '').trim();

    const parsed = parseJobQuery(rawQuery);
    if (!parsed.query && !parsed.region) {
      return NextResponse.json({ error: 'Missing search query (q)' }, { status: 400 });
    }

    const regionParam = params.get('region') ?? 'any';
    const roleTypeParam = params.get('roleType') ?? 'any';
    if (!regions.includes(regionParam) || !roleTypes.includes(roleTypeParam)) {
      return NextResponse.json({ error: 'Invalid region or roleType filter' }, { status: 400 });
    }

    // A location typed into the query box ("developer in Rwanda") wins: the user
    // said it explicitly, and the response echoes the region back to the UI.
    const region = (parsed.region ?? regionParam) as RegionFilter;
    const query = parsed.region ? parsed.query : rawQuery;

    const includeClosed = params.get('includeClosed') === 'true';

    const profile = await getProfile();
    const result = await searchJobs({
      query,
      region,
      roleType: roleTypeParam as RoleTypeFilter,
      profileSkills: profile?.skills ?? [],
      includeClosed,
    });

    return NextResponse.json({
      ...result,
      interpreted: { query, region, includeClosed, locationFromQuery: parsed.region !== null },
    });
  } catch (error) {
    console.error('GET /api/jobs/search error:', error);
    return NextResponse.json({ error: 'Job search failed' }, { status: 500 });
  }
}
