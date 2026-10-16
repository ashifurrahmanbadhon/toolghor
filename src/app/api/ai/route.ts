import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCorsHeaders, handleCorsPreflight, checkPersistentRateLimit } from '@/lib/security';
import { runConfigCheck } from '@/lib/configCheck';

const ALLOWED_ORIGINS = new Set([
  'https://toolghor.vercel.app',
  'https://toolghor.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Direct same-origin or server-side calls without Origin header
  if (
    ALLOWED_ORIGINS.has(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    (process.env.NEXT_PUBLIC_SITE_URL && origin === process.env.NEXT_PUBLIC_SITE_URL)
  ) {
    return true;
  }
  return false;
}

const TOOL_SYSTEM_PROMPTS: Record<string, string> = {
  'bmi-calculator': 'You are an experienced clinical nutritionist and fitness expert on ToolGhor. Provide practical, sustainable diet, nutrition, and physical activity advice.',
  'loan-emi-calculator': 'You are an experienced chartered accountant and banking financial advisor on ToolGhor. Provide clear, practical strategies to reduce loan costs and manage finances.',
  'zakat-calculator': 'You are a knowledgeable Islamic finance advisor on ToolGhor. Provide accurate, clear guidance on Zakat calculations, eligible assets, and Nisab.',
  'age-calculator': 'You are an insightful calendar and milestone advisor on ToolGhor. Provide engaging age-related insights, milestones, and planning advice.',
  'image-compressor': 'You are a digital image and web performance optimization specialist on ToolGhor. Provide practical recommendations for image quality, format selection, and storage savings.',
  'image-resizer': 'You are a professional graphic specialist on ToolGhor. Provide optimal dimensions and aspect ratio advice for social platforms and documents.',
  'remove-background': 'You are a professional photo stylist and cutout specialist on ToolGhor. Provide styling and background contrast recommendations.',
  'qr-generator': 'You are a QR code and digital security specialist on ToolGhor. Provide best practices for scannability, error correction, and design.',
  'qr-decoder': 'You are a cybersecurity and QR decoding specialist on ToolGhor. Analyze decoded data for safety, scam prevention, and proper URL validation.',
  'resume-builder': 'You are an expert HR recruiter and career coach on ToolGhor. Provide punchy, action-oriented, professional resume summaries and bullet points.',
};

function resolveSystemInstruction(toolSlug?: string, clientInstruction?: string): string {
  const defaultPrompt = 'You are an intelligent, expert AI assistant on ToolGhor. Provide clear, professional, practical, and well-structured responses.';
  
  // 1. Tool slug from allowlist
  let basePrompt = (toolSlug && TOOL_SYSTEM_PROMPTS[toolSlug]) ? TOOL_SYSTEM_PROMPTS[toolSlug] : defaultPrompt;

  // 2. Client-supplied instruction strictly validated and clamped
  if (typeof clientInstruction === 'string' && clientInstruction.trim()) {
    const clean = clientInstruction.trim().slice(0, 500);
    // Disallow prompt injection keywords
    const lower = clean.toLowerCase();
    const hasInjection = 
      lower.includes('ignore previous') ||
      lower.includes('ignore all') ||
      lower.includes('system prompt') ||
      lower.includes('reveal secret') ||
      lower.includes('reveal key') ||
      lower.includes('reveal api') ||
      lower.includes('jailbreak');

    if (!hasInjection) {
      return `${basePrompt} Context: ${clean}`;
    }
  }

  return basePrompt;
}

async function getServerAiKeys() {
  const envGemini = (process.env.GEMINI_API_KEY || '').trim();
  const envOpenai = (process.env.OPENAI_API_KEY || '').trim();
  const validEnvGemini = envGemini && envGemini !== 'your_gemini_key_here' && envGemini !== 'your_key_here';
  const validEnvOpenai = envOpenai && envOpenai !== 'your_openai_key_here' && envOpenai !== 'your_key_here';

  let geminiKey = validEnvGemini ? envGemini : '';
  let openaiKey = validEnvOpenai ? envOpenai : '';
  let geminiActive = Boolean(geminiKey);
  let openaiActive = Boolean(openaiKey);

  // If both keys are satisfied by env vars, env var wins unconditionally
  if (geminiKey && openaiKey) {
    return { geminiKey, openaiKey, geminiActive: true, openaiActive: true };
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT is_active, gemini_active, gemini_key, openai_active, openai_key
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && row.is_active) {
      // Env always wins over DB. Only fallback to DB if env var is missing:
      if (!geminiKey && row.gemini_active && row.gemini_key) {
        const dbGemini = row.gemini_key.trim();
        if (dbGemini) {
          geminiKey = dbGemini;
          geminiActive = true;
        }
      }
      if (!openaiKey && row.openai_active && row.openai_key) {
        const dbOpenai = row.openai_key.trim();
        if (dbOpenai) {
          openaiKey = dbOpenai;
          openaiActive = true;
        }
      }
    }
  } catch (err: any) {
    console.warn('[AI Proxy Warning]: Failed to fetch DB keys, using environment variables:', err?.message || err);
  }

  return { geminiKey, openaiKey, geminiActive, openaiActive };
}

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req, 'POST, OPTIONS');
}

export async function POST(req: NextRequest) {
  runConfigCheck();
  const corsHeaders = getCorsHeaders(req, 'POST, OPTIONS');
  const origin = req.headers.get('origin');

  // Strict CORS / Origin check
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden: Cross-origin request not allowed.',
        error_bn: 'অননুমোদিত অরিজিন থেকে রিকোয়েস্ট ব্লক করা হয়েছে।'
      },
      { status: 403, headers: corsHeaders }
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Persistent per-IP rate limit: generous 60 requests per hour to prevent wallet draining
  const rateLimit = await checkPersistentRateLimit(`ai_${ip}`, 60, 3600);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit reached. Please wait before making more AI requests.',
        error_bn: 'অনুরোধের সীমা শেষ হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
      },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, options } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt is required and must be non-empty.',
          error_bn: 'প্রম্পট প্রদান করা আবশ্যক।'
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Server-side caps
    const cleanPrompt = prompt.trim().slice(0, 8000);
    const rawTokens = Number(options?.maxTokens);
    const maxTokens = Math.min(Math.max(10, Number.isFinite(rawTokens) ? rawTokens : 1200), 1500);
    const rawTemp = Number(options?.temperature);
    const temperature = Math.min(Math.max(0, Number.isFinite(rawTemp) ? rawTemp : 0.7), 1);
    const toolSlug = typeof options?.toolSlug === 'string' ? options.toolSlug.trim() : undefined;
    const systemInstruction = resolveSystemInstruction(toolSlug, options?.systemInstruction);

    const { geminiKey, openaiKey, geminiActive, openaiActive } = await getServerAiKeys();

    // 1. Try Google Gemini if configured and active
    if (geminiActive && geminiKey) {
      const candidateModels = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-flash-lite-latest',
        'gemma-4-26b-a4b-it',
        'gemini-3.8-flash',
      ];
      for (const modelName of candidateModels) {
        try {
          const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(geminiKey)}`;
          const payload = {
            contents: [{ role: 'user', parts: [{ text: (systemInstruction ? (systemInstruction + '\n\n') : '') + cleanPrompt }] }],
            generationConfig: { temperature, maxOutputTokens: maxTokens },
          };

          const res = await fetch(gUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000),
          });

          if (!res.ok) {
            console.warn(`[AI Proxy]: Gemini model ${modelName} returned status ${res.status}`);
          }
          if (res.ok) {
            const data = await res.json();
            if (data.candidates && data.candidates[0]?.content?.parts) {
              const text = data.candidates[0].content.parts.map((p: any) => p.text || '').join('').trim();
              if (text) {
                return NextResponse.json(
                  { success: true, text, provider: 'Google Gemini' },
                  { headers: corsHeaders }
                );
              }
            }
          }
        } catch (geminiErr: any) {
          console.warn(`[AI Proxy]: Gemini request failed on model ${modelName}:`, geminiErr?.message);
        }
      }
    }

    // 2. Try OpenAI if configured and active
    if (openaiActive && openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: cleanPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          const oData = await res.json();
          if (oData.choices && oData.choices[0]?.message?.content) {
            const text = oData.choices[0].message.content.trim();
            if (text) {
              return NextResponse.json(
                { success: true, text, provider: 'OpenAI' },
                { headers: corsHeaders }
              );
            }
          }
        }
      } catch (openAiErr: any) {
        console.warn('[AI Proxy]: OpenAI request failed:', openAiErr?.message);
      }
    }

    // Fail-closed with 503 no_api_key
    return NextResponse.json(
      {
        success: false,
        text: null,
        error: 'no_api_key',
        message: 'No active AI API keys configured on server',
        message_bn: 'সার্ভারে কোনো সক্রিয় এআই API কী কনফিগার করা নেই।'
      },
      { status: 503, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[AI Proxy Error]:', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal AI proxy error',
        error_bn: 'অভ্যন্তরীণ এআই প্রক্সি ত্রুটি ঘটেছে।'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
