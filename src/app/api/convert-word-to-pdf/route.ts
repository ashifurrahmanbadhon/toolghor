import { NextRequest, NextResponse } from 'next/server';

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
  const token = (process.env.CONVERTAPI_TOKEN || '').trim();
  if (!token || token === 'your_token_here' || token === 'your_convertapi_token_here') {
    return NextResponse.json(
      { error: 'ConvertAPI token is not configured on the server.' },
      { status: 503 }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 }
      );
    }

    const bodyBuffer = await req.arrayBuffer();

    if (bodyBuffer.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit.' },
        { status: 413 }
      );
    }

    // Convert Word (DOCX or DOC) to PDF
    const convertApiResponse = await fetch('https://v2.convertapi.com/convert/docx/to/pdf', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: bodyBuffer,
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
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
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
