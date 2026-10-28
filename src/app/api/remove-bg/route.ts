import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders, handleCorsPreflight, checkPersistentRateLimit } from '@/lib/security';
import { runConfigCheck } from '@/lib/configCheck';
import { getRemoveBgKeys, isRotationStatus, logKeyRotation } from '@/lib/apiKeys';

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req, 'GET, POST, OPTIONS');
}

export async function POST(req: NextRequest) {
  runConfigCheck();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // 1. Persistent generous per-IP rate limit (100 conversions / day)
  const rateLimit = await checkPersistentRateLimit(`rbg_${ip}`, 100, 86400);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Daily conversion quota reached. Please try again tomorrow.',
        error_bn: 'দৈনিক কনভার্সন সীমা শেষ হয়েছে। অনুগ্রহ করে আগামীকাল আবার চেষ্টা করুন।'
      },
      { status: 429, headers: getCorsHeaders(req) }
    );
  }

  const keys = await getRemoveBgKeys();
  if (!keys || keys.length === 0) {
    return NextResponse.json(
      {
        error: 'remove.bg API service is not configured on the server. Please set REMOVE_BG_API_KEY.',
        error_bn: 'সার্ভারে remove.bg API কনফিগার করা নেই। অনুগ্রহ করে REMOVE_BG_API_KEY সেট করুন।'
      },
      { status: 503, headers: getCorsHeaders(req) }
    );
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image_file') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        {
          error: 'No image file provided',
          error_bn: 'কোনো ইমেজ ফাইল প্রদান করা হয়নি'
        },
        { status: 400, headers: getCorsHeaders(req) }
      );
    }

    // 2. File size cap (25MB) to protect serverless memory and API quotas
    if (imageFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'Image file size exceeds the allowed limit (25MB).',
          error_bn: 'ইমেজ ফাইলের সাইজ অনুমোদিত সীমা (২৫MB) অতিক্রম করেছে।'
        },
        { status: 413, headers: getCorsHeaders(req) }
      );
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    let lastErrorRes: NextResponse | null = null;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const outForm = new FormData();
      outForm.append(
        'image_file',
        new Blob([imageBuffer], { type: imageFile.type || 'image/png' }),
        imageFile.name || 'image.png'
      );
      outForm.append('size', 'auto');

      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': key,
        },
        body: outForm,
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const outBuffer = Buffer.from(await res.arrayBuffer());
        return new NextResponse(new Uint8Array(outBuffer), {
          status: 200,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'image/png',
          },
        });
      }

      const errJson = await res.json().catch(() => ({}));
      if (isRotationStatus(res.status)) {
        logKeyRotation('removebg', i, res.status);
        lastErrorRes = NextResponse.json(
          {
            error: (errJson && errJson.errors && errJson.errors[0]?.title) || 'Failed to remove background',
            error_bn: 'ব্যাকগ্রাউন্ড রিমুভ করা সম্ভব হয়নি।'
          },
          { status: res.status, headers: getCorsHeaders(req) }
        );
        continue;
      }

      // Other non-ok status (400 bad image format, 500) returns immediately
      return NextResponse.json(
        {
          error: (errJson && errJson.errors && errJson.errors[0]?.title) || 'Failed to remove background',
          error_bn: 'ব্যাকগ্রাউন্ড রিমুভ করা সম্ভব হয়নি।'
        },
        { status: res.status, headers: getCorsHeaders(req) }
      );
    }

    if (lastErrorRes) {
      return lastErrorRes;
    }
    return NextResponse.json(
      {
        error: 'Failed to remove background',
        error_bn: 'ব্যাকগ্রাউন্ড রিমুভ করা সম্ভব হয়নি।'
      },
      { status: 500, headers: getCorsHeaders(req) }
    );
  } catch (err: any) {
    console.error('[remove.bg Proxy Exception]', err);
    return NextResponse.json(
      {
        error: 'Internal server error processing background removal',
        error_bn: 'ব্যাকগ্রাউন্ড রিমুভ প্রসেসিংয়ে অভ্যন্তরীণ সার্ভার ত্রুটি ঘটেছে।'
      },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}
