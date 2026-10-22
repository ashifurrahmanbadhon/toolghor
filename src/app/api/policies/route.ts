import { NextRequest, NextResponse } from 'next/server';
import { getAllPolicySections, getPolicySection } from '@/lib/policiesData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section');

    if (section) {
      const secData = await getPolicySection(section);
      return NextResponse.json({ success: true, policy: secData }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        },
      });
    }

    const allPolicies = await getAllPolicySections();
    return NextResponse.json({ success: true, policies: allPolicies }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      },
    });
  } catch (error: any) {
    console.error('[Error in /api/policies GET]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
