import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
  const token = await getConvertApiToken();
  if (!token) {
    return NextResponse.json(
      { error: 'ConvertAPI service is not configured on the server. Please set CONVERTAPI_TOKEN.' },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('File')) as File | null;
    const pageRange = (formData.get('page_range') || formData.get('PageRange') || '') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided in request.' },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'File size exceeds the allowed limit (50MB). Please try a smaller PDF.',
        },
        { status: 413 }
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
    });

    if (!convertApiResponse.ok) {
      const errText = await convertApiResponse.text();
      console.error(`[ConvertAPI Error] Status ${convertApiResponse.status}: ${errText}`);
      return NextResponse.json(
        {
          error: 'Your PDF could not be converted at the moment. Please try again with another PDF.',
        },
        { status: 500 }
      );
    }

    const data = await convertApiResponse.json();
    const files = data.Files || [];
    if (!files.length) {
      return NextResponse.json(
        {
          error: 'ConvertAPI returned an empty result.',
        },
        { status: 500 }
      );
    }

    const first = files[0];
    let docxBuffer: Buffer | null = null;

    if (first.FileData) {
      docxBuffer = Buffer.from(first.FileData, 'base64');
    } else if (first.Url) {
      const dl = await fetch(first.Url);
      docxBuffer = Buffer.from(await dl.arrayBuffer());
    }

    if (!docxBuffer) {
      return NextResponse.json(
        {
          error: 'Failed to extract DOCX data from conversion response.',
        },
        { status: 500 }
      );
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${outName}"`,
        'X-Converted-By': 'ConvertAPI',
      },
    });
  } catch (error: any) {
    console.error('[ConvertAPI Proxy Exception]', error);
    return NextResponse.json(
      {
        error: 'An internal error occurred during conversion.',
      },
      { status: 500 }
    );
  }
}
