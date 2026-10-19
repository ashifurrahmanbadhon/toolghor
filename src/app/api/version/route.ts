import { NextResponse } from 'next/server';
import { ASSET_VERSION } from '@/data/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { version: ASSET_VERSION },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    }
  );
}
