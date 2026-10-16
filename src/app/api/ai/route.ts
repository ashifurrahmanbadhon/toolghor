import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

async function getServerAiKeys() {
  let geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  let openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  let geminiActive = Boolean(geminiKey);
  let openaiActive = Boolean(openaiKey);

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
      if (row.gemini_active && row.gemini_key) {
        geminiKey = row.gemini_key.trim();
        geminiActive = true;
      }
      if (row.openai_active && row.openai_key) {
        openaiKey = row.openai_key.trim();
        openaiActive = true;
      }
    }
  } catch (err) {
    console.warn('[AI Proxy Warning]: Failed to fetch DB keys, using environment variables:', err);
  }

  return { geminiKey, openaiKey, geminiActive, openaiActive };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, options } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const { geminiKey, openaiKey, geminiActive, openaiActive } = await getServerAiKeys();

    const systemInstruction = options?.systemInstruction || 'You are an intelligent, expert AI assistant on ToolGhor.';
    const temperature = options?.temperature != null ? options.temperature : 0.7;
    const maxTokens = options?.maxTokens || 1200;

    // 1. Try Google Gemini if configured and active
    if (geminiActive && geminiKey) {
      try {
        const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const payload = {
          contents: [{ role: 'user', parts: [{ text: (systemInstruction ? (systemInstruction + '\n\n') : '') + prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        };

        const res = await fetch(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.candidates && data.candidates[0]?.content?.parts) {
            const text = data.candidates[0].content.parts.map((p: any) => p.text || '').join('').trim();
            if (text) {
              return NextResponse.json({ success: true, text, provider: 'Google Gemini' });
            }
          }
        }
      } catch (geminiErr: any) {
        console.warn('[AI Proxy]: Gemini request failed, trying fallback provider:', geminiErr?.message);
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
              { role: 'user', content: prompt },
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
              return NextResponse.json({ success: true, text, provider: 'OpenAI' });
            }
          }
        }
      } catch (openAiErr: any) {
        console.warn('[AI Proxy]: OpenAI request failed:', openAiErr?.message);
      }
    }

    return NextResponse.json(
      { success: false, text: null, error: 'no_api_key' },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('[AI Proxy Error]:', err);
    return NextResponse.json({ success: false, error: 'Internal AI proxy error' }, { status: 500 });
  }
}
