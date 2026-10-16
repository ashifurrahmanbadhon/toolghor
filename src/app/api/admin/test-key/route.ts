import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { checkPersistentRateLimit } from '@/lib/security';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  // 1. Session-gated: only authenticated admin can invoke
  const session = verifyAdminRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  // 2. Persistent rate limiting: 30 requests per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimit = await checkPersistentRateLimit(`admin_test_key_${ip}`, 30, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: 'Too many test requests. Please wait a moment.',
        message_bn: 'অতিরিক্ত টেস্ট রিকোয়েস্ট পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।',
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { provider, key } = body;

    const ALLOWED_PROVIDERS = ['convertapi', 'gemini', 'removebg', 'openai'];
    const cleanProvider = typeof provider === 'string' ? provider.toLowerCase().trim() : '';
    if (!cleanProvider || !ALLOWED_PROVIDERS.includes(cleanProvider)) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: 'Invalid or unsupported provider specified.',
          message_bn: 'সঠিক বা সমর্থিত প্রোভাইডার উল্লেখ করা হয়নি।',
        },
        { status: 400 }
      );
    }

    // Resolve key: client-passed key, or fallback to server env, or fallback to DB
    let resolvedKey = typeof key === 'string' ? key.trim() : '';

    // If key contains mask bullets, resolve from server instead of testing the mask
    if (resolvedKey.startsWith('••') || resolvedKey.includes('••••')) {
      resolvedKey = '';
    }

    if (!resolvedKey) {
      if (cleanProvider === 'gemini') {
        resolvedKey = (process.env.GEMINI_API_KEY || '').trim();
      } else if (cleanProvider === 'convertapi') {
        resolvedKey = (process.env.CONVERTAPI_TOKEN || '').trim();
      } else if (cleanProvider === 'removebg') {
        resolvedKey = (process.env.REMOVE_BG_API_KEY || process.env.REMOVEBG_API_KEY || '').trim();
      } else if (cleanProvider === 'openai') {
        resolvedKey = (process.env.OPENAI_API_KEY || '').trim();
      }

      // Check DB if env var is empty
      if (!resolvedKey) {
        try {
          const sql = getDb();
          const rows = await sql`
            SELECT gemini_key, convertapi_token, removebg_key, openai_key
            FROM section_api_keys
            WHERE id = 1
            LIMIT 1
          `;
          const row = rows[0];
          if (row) {
            if (cleanProvider === 'gemini') resolvedKey = (row.gemini_key || '').trim();
            else if (cleanProvider === 'convertapi') resolvedKey = (row.convertapi_token || '').trim();
            else if (cleanProvider === 'removebg') resolvedKey = (row.removebg_key || '').trim();
            else if (cleanProvider === 'openai') resolvedKey = (row.openai_key || '').trim();
          }
        } catch {}
      }
    }

    if (!resolvedKey) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'No API key provided or configured on server.',
        message_bn: 'কোনো API কী প্রদান করা হয়নি বা সার্ভারে কনফিগার করা নেই।',
      });
    }

    // Never log key values - only log validation attempt
    console.log(`[Admin Test Key]: Validating credentials for provider: ${cleanProvider}`);

    // --- Provider Validations ---

    if (cleanProvider === 'convertapi') {
      try {
        const res = await fetch(`https://v2.convertapi.com/user?Secret=${encodeURIComponent(resolvedKey)}`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const seconds = typeof data.SecondsLeft === 'number' ? ` (${data.SecondsLeft}s left)` : '';
          return NextResponse.json({
            success: true,
            valid: true,
            message: `Valid ConvertAPI secret${seconds}.`,
            message_bn: `ConvertAPI সিক্রেটটি সফলভাবে যাচাই হয়েছে${seconds}।`,
          });
        }
        return NextResponse.json({
          success: true,
          valid: false,
          message: `Invalid ConvertAPI secret (HTTP ${res.status}).`,
          message_bn: `ConvertAPI সিক্রেটটি সঠিক নয় (HTTP ${res.status})।`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: true,
          valid: false,
          message: `ConvertAPI connection error: ${err?.message || 'timeout'}`,
          message_bn: 'ConvertAPI সংযোগ ব্যর্থ হয়েছে বা সময় শেষ হয়েছে।',
        });
      }
    }

    if (cleanProvider === 'gemini') {
      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];
      let lastStatus = 0;
      for (const modelName of candidateModels) {
        try {
          const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(resolvedKey)}`;
          const res = await fetch(gUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
              generationConfig: { maxOutputTokens: 1 },
            }),
            signal: AbortSignal.timeout(10000),
          });
          lastStatus = res.status;
          if (res.ok) {
            return NextResponse.json({
              success: true,
              valid: true,
              message: 'Valid Google Gemini API key.',
              message_bn: 'Google Gemini API কী সফলভাবে যাচাই হয়েছে।',
            });
          }
        } catch {
          // try next model
        }
      }
      return NextResponse.json({
        success: true,
        valid: false,
        message: `Invalid Gemini API key (HTTP ${lastStatus || 'error'}).`,
        message_bn: `Gemini API কী সঠিক নয় (HTTP ${lastStatus || 'ত্রুটি'})।`,
      });
    }

    if (cleanProvider === 'removebg') {
      // remove.bg has no free ping endpoint; validate structure and notify
      const isFormatValid = resolvedKey.length >= 16 && /^[a-zA-Z0-9_-]+$/.test(resolvedKey);
      if (isFormatValid) {
        return NextResponse.json({
          success: true,
          valid: true,
          message: 'Key format valid. Saved — test with one image (1 credit required to verify with live API).',
          message_bn: 'কী ফরম্যাট সঠিক। সেভ করা হয়েছে — লাইভ এপিআই যাচাই করতে ১টি ছবি দিয়ে পরীক্ষা করুন (১ ক্রেডিট প্রয়োজন)।',
        });
      }
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'Invalid remove.bg API key format.',
        message_bn: 'remove.bg API কী-এর ফরম্যাট সঠিক নয়।',
      });
    }

    if (cleanProvider === 'openai') {
      try {
        const res = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${resolvedKey}`,
          },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          return NextResponse.json({
            success: true,
            valid: true,
            message: 'Valid OpenAI API key.',
            message_bn: 'OpenAI API কী সফলভাবে যাচাই হয়েছে।',
          });
        }
        return NextResponse.json({
          success: true,
          valid: false,
          message: `Invalid OpenAI API key (HTTP ${res.status}).`,
          message_bn: `OpenAI API কী সঠিক নয় (HTTP ${res.status})।`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: true,
          valid: false,
          message: `OpenAI connection error: ${err?.message || 'timeout'}`,
          message_bn: 'OpenAI সংযোগ ব্যর্থ হয়েছে বা সময় শেষ হয়েছে।',
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: `Unknown provider: ${provider}`,
        message_bn: `অজানা প্রোভাইডার: ${provider}`,
      },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: 'Key validation failed.',
        message_bn: 'কী যাচাইকরণ ব্যর্থ হয়েছে।',
      },
      { status: 500 }
    );
  }
}
