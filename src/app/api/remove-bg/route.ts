import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

async function getRemoveBgKey(): Promise<string> {
  const envKey = (process.env.REMOVE_BG_API_KEY || process.env.REMOVEBG_API_KEY || '').trim();
  if (envKey && envKey !== 'your_key_here') {
    return envKey;
  }
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT removebg_active, removebg_key
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && row.removebg_active && row.removebg_key) {
      const dbKey = row.removebg_key.trim();
      if (dbKey) return dbKey;
    }
  } catch (e) {}
  return '';
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
  if (!key) {
    return NextResponse.json(
      { error: 'remove.bg API service is not configured on the server. Please set REMOVE_BG_API_KEY.' },
      { status: 503 }
    );
  }

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
