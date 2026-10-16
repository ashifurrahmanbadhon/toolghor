import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as getPublicData } from '../src/app/api/public/data/route';
import { GET as getAdminData, POST as postAdminData } from '../src/app/api/admin/data/route';
import { OPTIONS as optionsAi, POST as postAi } from '../src/app/api/ai/route';
import { siteConfig } from '../src/data/config';
import fs from 'node:fs';
import path from 'node:path';

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
});

test('Security Verification — Admin Data Authorization', async (t) => {
  await t.test('GET /api/admin/data returns 401 without valid session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/data');
    const res = await getAdminData(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Unauthorized/);
  });

  await t.test('POST /api/admin/data returns 401 without valid session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/data', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_hero', payload: {} }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postAdminData(req);
    assert.equal(res.status, 401);
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
    // When no external API keys are active, fail-closed with 503
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error, 'no_api_key');
    assert.ok(body.message_bn, 'Must include bilingual message');
  });

  await t.test('POST /api/ai enforces per-IP persistent rate limit when hammered', async () => {
    const testIp = '198.51.100.42';
    // Send requests with the same IP until throttled
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
