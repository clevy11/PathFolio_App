import { NextResponse } from 'next/server';
import { getApplicationStats } from '@/lib/services/tracker';

export async function GET() {
  try {
    const stats = await getApplicationStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
