import { NextRequest, NextResponse } from 'next/server';
import { getPublicSiteData } from '@/lib/siteData';
import { runConfigCheck } from '@/lib/configCheck';

export const revalidate = 60;

export async function GET(req: NextRequest) {
  runConfigCheck();
  try {
    const data = await getPublicSiteData();
    if (!data) {
      return NextResponse.json({ success: false, error: 'Failed to fetch site data' }, { status: 500 });
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        'Vercel-CDN-Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('[Error in /api/public/data]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
