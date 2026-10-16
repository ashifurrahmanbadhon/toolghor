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
  const rateLimit = await checkPersistentRateLimit(`p2d_${ip}`, 100, 86400);
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
    const pageRange = (formData.get('page_range') || formData.get('PageRange') || '') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided in request.' },
        { status: 400, headers: getCorsHeaders(req) }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'File size exceeds the allowed limit (50MB). Please try a smaller PDF.',
        },
        { status: 413, headers: getCorsHeaders(req) }
      );
    }

    // Forward to ConvertAPI
    const convertForm = new FormData();
    convertForm.append('File', file);
    if (pageRange) {
      convertForm.append('PageRange', pageRange);
    }
    convertForm.append('StoreFile', 'false');

    const convertApiResponse = await fetch('https://v2.convertapi.com/convert/pdf/to/docx', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: convertForm,
      signal: AbortSignal.timeout(15000),
    });

    if (!convertApiResponse.ok) {
      const errText = await convertApiResponse.text();
      console.error(`[ConvertAPI Error] Status ${convertApiResponse.status}: ${errText}`);
      return NextResponse.json(
        {
          error: 'Your PDF could not be converted at the moment. Please try again with another PDF.',
        },
        { status: 500, headers: getCorsHeaders(req) }
      );
    }

    const data = await convertApiResponse.json();
    const files = data.Files || [];
    if (!files.length) {
      return NextResponse.json(
        {
          error: 'ConvertAPI returned an empty result.',
        },
        { status: 500, headers: getCorsHeaders(req) }
      );
    }

    const first = files[0];
    let docxBuffer: Buffer | null = null;

    if (first.FileData) {
      docxBuffer = Buffer.from(first.FileData, 'base64');
    } else if (first.Url) {
      const dl = await fetch(first.Url, { signal: AbortSignal.timeout(15000) });
      docxBuffer = Buffer.from(await dl.arrayBuffer());
    }

    if (!docxBuffer) {
      return NextResponse.json(
        {
          error: 'Failed to extract DOCX data from conversion response.',
        },
        { status: 500, headers: getCorsHeaders(req) }
      );
    }

    const baseName = (file.name || 'document').replace(/\.[^/.]+$/, '');
    const outName = `${baseName}.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': sanitizeContentDisposition(outName, 'converted.docx'),
        'X-Converted-By': 'ConvertAPI',
      },
    });
  } catch (error: any) {
    console.error('[ConvertAPI Proxy Exception]', error);
    return NextResponse.json(
      {
        error: 'An internal error occurred during conversion.',
      },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}
