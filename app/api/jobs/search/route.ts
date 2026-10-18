import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/services/profile';
import { searchJobs, type RegionFilter, type RoleTypeFilter } from '@/lib/services/search';

const regions = ['any', 'remote', 'united-states', 'europe', 'united-kingdom', 'canada', 'africa', 'asia', 'oceania'];
const roleTypes = ['any', 'full-time', 'contract', 'part-time', 'internship', 'temporary', 'unknown'];

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const query = (params.get('q') ?? '').trim();
    if (!query) {
      return NextResponse.json({ error: 'Missing search query (q)' }, { status: 400 });
    }

    const regionParam = params.get('region') ?? 'any';
    const roleTypeParam = params.get('roleType') ?? 'any';
    if (!regions.includes(regionParam) || !roleTypes.includes(roleTypeParam)) {
      return NextResponse.json({ error: 'Invalid region or roleType filter' }, { status: 400 });
    }

    const profile = await getProfile();
    const result = await searchJobs({
      query,
      region: regionParam as RegionFilter,
      roleType: roleTypeParam as RoleTypeFilter,
      profileSkills: profile?.skills ?? [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/jobs/search error:', error);
    return NextResponse.json({ error: 'Job search failed' }, { status: 500 });
  }
}