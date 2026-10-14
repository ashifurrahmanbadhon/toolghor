import { NextRequest, NextResponse } from 'next/server';
import { getPublicSiteData } from '@/lib/siteData';

// Default ConvertAPI token from ToolGhor (Netlify & production configuration)
const DEFAULT_CONVERTAPI_TOKEN = 'skmyWmKCXHFXHogM2ixxitPKCIKUcOEJ';

async function getConvertApiToken(): Promise<string> {
  const envToken = (process.env.CONVERTAPI_TOKEN || '').trim();
  if (envToken && envToken !== 'your_token_here' && envToken !== 'your_convertapi_token_here') {
    return envToken;
  }
  try {
    const siteData = await getPublicSiteData();
    if (siteData?.apiKeys?.convertapi_active && siteData.apiKeys.convertapi_token) {
      const dbToken = siteData.apiKeys.convertapi_token.trim();
      if (dbToken) return dbToken;
    }
  } catch (e) {}
  return DEFAULT_CONVERTAPI_TOKEN;
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

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('File')) as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No Word file provided in request.' },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit.' },
        { status: 413 }
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
    });

    if (!convertApiResponse.ok) {
      const errText = await convertApiResponse.text();
      console.error(`[ConvertAPI Word->PDF Error] Status ${convertApiResponse.status}: ${errText}`);
      return NextResponse.json(
        { error: 'Conversion failed on server.' },
        { status: 500 }
      );
    }

    const data = await convertApiResponse.json();
    const files = data.Files || [];
    if (!files.length) {
      return NextResponse.json(
        { error: 'ConvertAPI returned an empty result.' },
        { status: 500 }
      );
    }

    const first = files[0];
    let pdfBuffer: Buffer | null = null;

    if (first.FileData) {
      pdfBuffer = Buffer.from(first.FileData, 'base64');
    } else if (first.Url) {
      const dl = await fetch(first.Url);
      pdfBuffer = Buffer.from(await dl.arrayBuffer());
    }

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Failed to extract PDF data from conversion response.' },
        { status: 500 }
      );
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${outName}"`,
        'X-Converted-By': 'ConvertAPI',
      },
    });
  } catch (error: any) {
    console.error('[ConvertAPI Word->PDF Exception]', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
