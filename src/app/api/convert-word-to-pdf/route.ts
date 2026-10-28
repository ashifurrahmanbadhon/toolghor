import { NextRequest, NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflight,
  checkPersistentRateLimit,
  sanitizeContentDisposition,
} from '@/lib/security';
import { runConfigCheck } from '@/lib/configCheck';
import { getConvertApiKeys, isRotationStatus, logKeyRotation } from '@/lib/apiKeys';

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req, 'GET, POST, OPTIONS');
}

export async function POST(req: NextRequest) {
  runConfigCheck();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // 1. Persistent generous per-IP rate limit (100 conversions / day)
  const rateLimit = await checkPersistentRateLimit(`w2p_${ip}`, 100, 86400);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Daily conversion quota reached. Please try again tomorrow.',
        error_bn: 'দৈনিক কনভার্সন সীমা শেষ হয়েছে। অনুগ্রহ করে আগামীকাল আবার চেষ্টা করুন।'
      },
      { status: 429, headers: getCorsHeaders(req) }
    );
  }

  const tokens = await getConvertApiKeys();
  if (!tokens || tokens.length === 0) {
    return NextResponse.json(
      {
        error: 'ConvertAPI service is not configured on the server. Please set CONVERTAPI_TOKEN.',
        error_bn: 'সার্ভারে ConvertAPI সার্ভিস কনফিগার করা নেই। অনুগ্রহ করে CONVERTAPI_TOKEN সেট করুন।'
      },
      { status: 503, headers: getCorsHeaders(req) }
    );
  }

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('File')) as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: 'No Word file provided in request.',
          error_bn: 'অনুরোধে কোনো ওয়ার্ড ফাইল প্রদান করা হয়নি।'
        },
        { status: 400, headers: getCorsHeaders(req) }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'File size exceeds 50MB limit.',
          error_bn: 'ফাইলের সাইজ ৫০MB সীমা অতিক্রম করেছে।'
        },
        { status: 413, headers: getCorsHeaders(req) }
      );
    }

    // Determine endpoint based on file extension
    const isDoc = file.name.toLowerCase().endsWith('.doc');
    const endpoint = isDoc
      ? 'https://v2.convertapi.com/convert/doc/to/pdf'
      : 'https://v2.convertapi.com/convert/docx/to/pdf';

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let lastErrorRes: NextResponse | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const convertForm = new FormData();
      convertForm.append('File', new Blob([fileBuffer], { type: file.type || 'application/msword' }), file.name || 'document.docx');
      convertForm.append('StoreFile', 'false');

      const convertApiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: convertForm,
        signal: AbortSignal.timeout(15000),
      });

      if (convertApiResponse.ok) {
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
            {
              error: 'Failed to extract PDF data from conversion response.',
              error_bn: 'কনভার্সন ফলাফল থেকে PDF ফাইল তৈরি করা সম্ভব হয়নি।'
            },
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
      }

      if (isRotationStatus(convertApiResponse.status)) {
        logKeyRotation('convertapi', i, convertApiResponse.status);
        lastErrorRes = NextResponse.json(
          { error: 'Conversion failed due to service quota limit.' },
          { status: convertApiResponse.status, headers: getCorsHeaders(req) }
        );
        continue;
      }

      // Other non-ok status (400, 500) returns immediately
      const errText = await convertApiResponse.text().catch(() => '');
      console.error(`[ConvertAPI Word->PDF Error] Status ${convertApiResponse.status}: ${errText}`);
      return NextResponse.json(
        { error: 'Conversion failed on server.' },
        { status: convertApiResponse.status >= 400 && convertApiResponse.status < 600 ? convertApiResponse.status : 500, headers: getCorsHeaders(req) }
      );
    }

    if (lastErrorRes) return lastErrorRes;
    return NextResponse.json(
      { error: 'Conversion failed on server.' },
      { status: 500, headers: getCorsHeaders(req) }
    );
  } catch (error: any) {
    console.error('[ConvertAPI Word->PDF Exception]', error);
    return NextResponse.json(
      {
        error: 'An internal error occurred.',
        error_bn: 'অভ্যন্তরীণ সার্ভার ত্রুটি ঘটেছে।'
      },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}
