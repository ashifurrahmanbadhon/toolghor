import { NextRequest, NextResponse } from 'next/server';
import { getAllPolicySections, getPolicySection } from '@/lib/policiesData';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const section = req.nextUrl.searchParams.get('section');

    if (section) {
      const secData = await getPolicySection(section);
      return NextResponse.json({ success: true, policy: secData }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'CDN-Cache-Control': 's-maxage=60, stale-while-revalidate=300',
          'Vercel-CDN-Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    const allPolicies = await getAllPolicySections();
    return NextResponse.json({ success: true, policies: allPolicies }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        'Vercel-CDN-Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('[Error in /api/policies GET]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
