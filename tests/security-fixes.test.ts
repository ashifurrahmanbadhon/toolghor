import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as getPublicData } from '../src/app/api/public/data/route';
import { GET as getAdminData, POST as postAdminData } from '../src/app/api/admin/data/route';
import { POST as postAdminAuth } from '../src/app/api/admin/auth/route';
import { OPTIONS as optionsAi, POST as postAi } from '../src/app/api/ai/route';
import { POST as postRemoveBg } from '../src/app/api/remove-bg/route';
import { POST as postWordToPdf } from '../src/app/api/convert-word-to-pdf/route';
import { POST as postPdfToDocx } from '../src/app/api/convert-pdf-to-docx/route';
import { siteConfig } from '../src/data/config';
import { getConfigStatus, runConfigCheck } from '../src/lib/configCheck';
import fs from 'node:fs';
import path from 'node:path';

// Helper to recursively collect files
function getFilesRecursively(dir: string, extensions: string[]): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (dirent.name !== 'node_modules' && dirent.name !== '.next') {
        results = results.concat(getFilesRecursively(fullPath, extensions));
      }
    } else if (extensions.some((ext) => dirent.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

test('Security Verification — Public Data & Configs', async (t) => {
  await t.test('siteConfig.apis contains no hardcoded secret values', () => {
    assert.equal(siteConfig.apis.removeBgKey, '');
    assert.equal(siteConfig.apis.geminiKey, '');
    assert.equal(siteConfig.apis.openaiKey, '');
  });

  await t.test('public/assets/config.js contains no hardcoded API key literals', () => {
    const configJs = fs.readFileSync(path.join(process.cwd(), 'public/assets/config.js'), 'utf-8');
    assert.match(configJs, /removeBgKey:\s*['"]{2}/, 'removeBgKey must be empty in public config.js');
    assert.ok(!configJs.includes('admin123'), 'admin123 must not be in public config.js');
  });

  await t.test('GET /api/public/data returns zero secret keys (only active flags)', async () => {
    const req = new NextRequest('http://localhost:3000/api/public/data');
    const res = await getPublicData(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    if (data.apiKeys) {
      assert.equal(typeof data.apiKeys.is_active, 'boolean');
      assert.equal(typeof data.apiKeys.gemini_active, 'boolean');
      assert.equal(typeof data.apiKeys.openai_active, 'boolean');
      assert.equal(typeof data.apiKeys.convertapi_active, 'boolean');
      assert.equal(typeof data.apiKeys.removebg_active, 'boolean');
      assert.equal(data.apiKeys.gemini_key, undefined);
      assert.equal(data.apiKeys.openai_key, undefined);
      assert.equal(data.apiKeys.convertapi_token, undefined);
      assert.equal(data.apiKeys.removebg_key, undefined);
    }
  });

  await t.test('Repository scan: zero hardcoded secret tokens in src/ and public/', () => {
    const targets = [
      ...getFilesRecursively(path.join(process.cwd(), 'src'), ['.ts', '.tsx']),
      ...getFilesRecursively(path.join(process.cwd(), 'public'), ['.js', '.json']),
    ];

    const forbiddenPatterns = [
      /\badmin123\b/i,
      /\bDEFAULT_CONVERTAPI_TOKEN\b/,
      /\bsk-[a-zA-Z0-9]{32,}\b/, // Generic OpenAI live key
      /\bAIzaSy[a-zA-Z0-9_-]{33}\b/, // Generic Google live key
    ];

    for (const filePath of targets) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        assert.ok(
          !pattern.test(content),
          `Hardcoded secret pattern ${pattern} detected in file: ${filePath}`
        );
      }
    }
  });
});

test('Security Verification — Admin Auth & Action Session Gating', async (t) => {
  await t.test('GET /api/admin/data returns 401 without valid session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/data');
    const res = await getAdminData(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Unauthorized/);
  });

  await t.test('POST /api/admin/data (update_hero) returns 401 without valid session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/data', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_hero', payload: {} }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postAdminData(req);
    assert.equal(res.status, 401);
  });

  await t.test('POST /api/admin/data (update_api_keys) returns 401 without valid session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/data', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_api_keys', payload: {} }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postAdminData(req);
    assert.equal(res.status, 401);
  });

  await t.test('POST /api/admin/auth (get_profile) returns 401 without valid session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'get_profile' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postAdminAuth(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Unauthorized/);
    assert.ok(body.message_bn, 'Must include Bengali message');
  });

  await t.test('POST /api/admin/auth (update_profile) returns 401 without valid session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_profile',
        current_passcode: 'wrong',
        new_passcode: 'testPass1234',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postAdminAuth(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Unauthorized/);
    assert.ok(body.message_bn, 'Must include Bengali message');
  });

  await t.test('POST /api/admin/auth (login) with wrong passcode returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', passcode: 'wrong_passcode_9999' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postAdminAuth(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Incorrect admin passcode/);
  });
});

test('Security Verification — AI Proxy Hardening (/api/ai)', async (t) => {
  await t.test('OPTIONS /api/ai returns restricted CORS preflight', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai', {
      method: 'OPTIONS',
      headers: { Origin: 'https://toolghor.vercel.app' },
    });
    const res = await optionsAi(req);
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://toolghor.vercel.app');
  });

  await t.test('POST /api/ai rejects unauthorized foreign origins with 403', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://malicious-external-site.com',
      },
      body: JSON.stringify({ prompt: 'Hello AI' }),
    });
    const res = await postAi(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Cross-origin request not allowed'));
    assert.ok(body.error_bn, 'Must include Bengali error message');
  });

  await t.test('POST /api/ai requires non-empty prompt', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ prompt: '   ' }),
    });
    const res = await postAi(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error_bn, 'Must include Bengali error message');
  });

  await t.test('POST /api/ai fails closed with 503 no_api_key when no server keys configured', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://toolghor.vercel.app',
        'x-forwarded-for': '127.0.0.99',
      },
      body: JSON.stringify({
        prompt: 'Calculate BMI recommendation',
        options: {
          maxTokens: 50000, // Should be clamped to <= 1500
          temperature: 99,  // Should be clamped to <= 1.0
          systemInstruction: 'Custom instruction',
        },
      }),
    });
    const res = await postAi(req);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'no_api_key');
    assert.ok(body.message_bn, 'Must include bilingual message');
  });

  await t.test('POST /api/ai enforces per-IP persistent rate limit when hammered', async () => {
    const testIp = '198.51.100.42';
    let throttled = false;
    for (let i = 0; i < 65; i++) {
      const req = new NextRequest('http://localhost:3000/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
          'x-forwarded-for': testIp,
        },
        body: JSON.stringify({ prompt: 'Hammer test ' + i }),
      });
      const res = await postAi(req);
      if (res.status === 429) {
        throttled = true;
        const body = await res.json();
        assert.equal(body.success, false);
        assert.ok(body.error.includes('Rate limit'));
        assert.ok(body.error_bn, 'Must include Bengali message');
        break;
      }
    }
    assert.ok(throttled, 'Expected IP hammering to trigger 429 rate limit');
  });
});

test('Security Verification — Server Config Health Check & Bilingual Fail-Closed', async (t) => {
  await t.test('runConfigCheck logs only PRESENT / MISSING without leaking values', () => {
    const logs: string[] = [];
    const origLog = console.log;
    try {
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };
      const status = runConfigCheck(true);
      assert.ok(status.AUTH_SECRET === 'PRESENT' || status.AUTH_SECRET === 'MISSING');
      assert.ok(status.DATABASE_URL === 'PRESENT' || status.DATABASE_URL === 'MISSING');
      assert.ok(status.REMOVE_BG_API_KEY === 'PRESENT' || status.REMOVE_BG_API_KEY === 'MISSING');
      assert.ok(status.CONVERTAPI_TOKEN === 'PRESENT' || status.CONVERTAPI_TOKEN === 'MISSING');
      assert.ok(status.RESEND_API_KEY_OR_SMTP === 'PRESENT' || status.RESEND_API_KEY_OR_SMTP === 'MISSING');

      // Verify that every config check log line matches [CONFIG] KEY: (PRESENT|MISSING)
      const configLines = logs.filter((l) => l.startsWith('[CONFIG]'));
      assert.ok(configLines.length >= 5, 'Should log at least 5 config check lines');
      for (const line of configLines) {
        assert.match(line, /^\[CONFIG\] [A-Z_]+: (PRESENT|MISSING)$/);
      }
    } finally {
      console.log = origLog;
    }
  });

  await t.test('getConfigStatus correctly reports MISSING when an environment variable is absent', () => {
    const origAuth = process.env.AUTH_SECRET;
    try {
      delete process.env.AUTH_SECRET;
      const status = getConfigStatus();
      assert.equal(status.AUTH_SECRET, 'MISSING');
    } finally {
      if (origAuth !== undefined) process.env.AUTH_SECRET = origAuth;
    }
  });

  await t.test('POST /api/remove-bg fails closed with bilingual error when key is unconfigured', async () => {
    const origKey = process.env.REMOVE_BG_API_KEY;
    try {
      delete process.env.REMOVE_BG_API_KEY;
      const req = new NextRequest('http://localhost:3000/api/remove-bg', {
        method: 'POST',
      });
      const res = await postRemoveBg(req);
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.ok(body.error.includes('remove.bg API service is not configured'));
      assert.ok(body.error_bn, 'Must include Bengali error message');
    } finally {
      if (origKey !== undefined) process.env.REMOVE_BG_API_KEY = origKey;
    }
  });

  await t.test('POST /api/convert-word-to-pdf fails closed with bilingual error when token is unconfigured', async () => {
    const origToken = process.env.CONVERTAPI_TOKEN;
    try {
      delete process.env.CONVERTAPI_TOKEN;
      const req = new NextRequest('http://localhost:3000/api/convert-word-to-pdf', {
        method: 'POST',
      });
      const res = await postWordToPdf(req);
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.ok(body.error.includes('ConvertAPI service is not configured'));
      assert.ok(body.error_bn, 'Must include Bengali error message');
    } finally {
      if (origToken !== undefined) process.env.CONVERTAPI_TOKEN = origToken;
    }
  });

  await t.test('POST /api/convert-pdf-to-docx fails closed with bilingual error when token is unconfigured', async () => {
    const origToken = process.env.CONVERTAPI_TOKEN;
    try {
      delete process.env.CONVERTAPI_TOKEN;
      const req = new NextRequest('http://localhost:3000/api/convert-pdf-to-docx', {
        method: 'POST',
      });
      const res = await postPdfToDocx(req);
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.ok(body.error.includes('ConvertAPI service is not configured'));
      assert.ok(body.error_bn, 'Must include Bengali error message');
    } finally {
      if (origToken !== undefined) process.env.CONVERTAPI_TOKEN = origToken;
    }
  });
});
