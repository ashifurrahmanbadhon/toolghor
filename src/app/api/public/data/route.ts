import { NextRequest, NextResponse } from 'next/server';
import { getPublicSiteData } from '@/lib/siteData';
import { runConfigCheck } from '@/lib/configCheck';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  runConfigCheck();
  try {
    const data = await getPublicSiteData();
    if (!data) {
      return NextResponse.json({ success: false, error: 'Failed to fetch site data' }, { status: 500 });
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[Error in /api/public/data]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
