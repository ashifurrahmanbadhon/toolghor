import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  getCorsHeaders,
  handleCorsPreflight,
  checkPersistentRateLimit,
  sanitizeContentDisposition,
} from '@/lib/security';

async function getConvertApiToken(): Promise<string> {
  const envToken = (process.env.CONVERTAPI_TOKEN || '').trim();
  if (envToken && envToken !== 'your_token_here' && envToken !== 'your_convertapi_token_here') {
    return envToken;
  }
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT convertapi_active, convertapi_token
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && row.convertapi_active && row.convertapi_token) {
      const dbToken = row.convertapi_token.trim();
      if (dbToken) return dbToken;
    }
  } catch (e) {}
  return '';
}

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req, 'GET, POST, OPTIONS');
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // 1. Persistent generous per-IP rate limit (100 conversions / day)
  const rateLimit = await checkPersistentRateLimit(`w2p_${ip}`, 100, 86400);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Daily conversion quota reached. Please try again tomorrow.' },
      { status: 429, headers: getCorsHeaders(req) }
    );
  }

  const token = await getConvertApiToken();
  if (!token) {
    return NextResponse.json(
      { error: 'ConvertAPI service is not configured on the server. Please set CONVERTAPI_TOKEN.' },
      { status: 503, headers: getCorsHeaders(req) }
    );
  }

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('File')) as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No Word file provided in request.' },
        { status: 400, headers: getCorsHeaders(req) }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit.' },
        { status: 413, headers: getCorsHeaders(req) }
      );
    }

    // Determine endpoint based on file extension
    const isDoc = file.name.toLowerCase().endsWith('.doc');
    const endpoint = isDoc
      ? 'https://v2.convertapi.com/convert/doc/to/pdf'
      : 'https://v2.convertapi.com/convert/docx/to/pdf';

    const convertForm = new FormData();
    convertForm.append('File', file);
    convertForm.append('StoreFile', 'false');

    const convertApiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: convertForm,
      signal: AbortSignal.timeout(15000),
    });

    if (!convertApiResponse.ok) {
      const errText = await convertApiResponse.text();
      console.error(`[ConvertAPI Word->PDF Error] Status ${convertApiResponse.status}: ${errText}`);
      return NextResponse.json(
        { error: 'Conversion failed on server.' },
        { status: 500, headers: getCorsHeaders(req) }
      );
    }

    const data = await convertApiResponse.json();
    const files = data.Files || [];
    if (!files.length) {
      return NextResponse.json(
        { error: 'ConvertAPI returned an empty result.' },
        { status: 500, headers: getCorsHeaders(req) }
      );
    }

    const first = files[0];
    let pdfBuffer: Buffer | null = null;

    if (first.FileData) {
      pdfBuffer = Buffer.from(first.FileData, 'base64');
    } else if (first.Url) {
      const dl = await fetch(first.Url, { signal: AbortSignal.timeout(15000) });
      pdfBuffer = Buffer.from(await dl.arrayBuffer());
    }

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Failed to extract PDF data from conversion response.' },
        { status: 500, headers: getCorsHeaders(req) }
      );
    }

    const baseName = (file.name || 'document').replace(/\.[^/.]+$/, '');
    const outName = `${baseName}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'application/pdf',
        'Content-Disposition': sanitizeContentDisposition(outName, 'converted.pdf'),
        'X-Converted-By': 'ConvertAPI',
      },
    });
  } catch (error: any) {
    console.error('[ConvertAPI Word->PDF Exception]', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}
