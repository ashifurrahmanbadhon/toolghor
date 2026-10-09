import { NextRequest, NextResponse } from 'next/server';
import { getPublicSiteData } from '@/lib/siteData';

export async function GET(req: NextRequest) {
  try {
    const data = await getPublicSiteData();
    if (!data) {
      return NextResponse.json({ success: false, error: 'Failed to fetch site data' }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Error in /api/public/data]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
