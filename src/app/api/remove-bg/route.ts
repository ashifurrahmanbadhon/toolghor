import { NextRequest, NextResponse } from 'next/server';
import { getPublicSiteData } from '@/lib/siteData';

const DEFAULT_REMOVEBG_KEY = '***REMOVED***';

async function getRemoveBgKey(): Promise<string> {
  const envKey = (process.env.REMOVE_BG_API_KEY || '').trim();
  if (envKey && envKey !== 'your_key_here') {
    return envKey;
  }
  try {
    const siteData = await getPublicSiteData();
    if (siteData?.apiKeys?.removebg_active && siteData.apiKeys.removebg_key) {
      const dbKey = siteData.apiKeys.removebg_key.trim();
      if (dbKey) return dbKey;
    }
  } catch (e) {}
  return DEFAULT_REMOVEBG_KEY;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  const key = await getRemoveBgKey();

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image_file') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const outForm = new FormData();
    outForm.append('image_file', imageFile);
    outForm.append('size', 'auto');

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': key,
      },
      body: outForm,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('[remove.bg API Error]', res.status, errJson);
      return NextResponse.json(
        { error: (errJson && errJson.errors && errJson.errors[0]?.title) || 'Failed to remove background' },
        { status: res.status }
      );
    }

    const imageBuffer = Buffer.from(await res.arrayBuffer());

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'image/png',
      },
    });
  } catch (err: any) {
    console.error('[remove.bg Proxy Exception]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
