import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRotationStatus,
  logKeyRotation,
  getGeminiKeys,
  getOpenAiKeys,
  getConvertApiKeys,
  getRemoveBgKeys,
  getILovePdfKeys,
} from '../src/lib/apiKeys';
import { getPublicSiteData } from '../src/lib/siteData';
import { getDb } from '../src/lib/db';

test('API Keys Rotation & Multi-Key Helper Unit Tests', async (t) => {
  await t.test('isRotationStatus accurately identifies auth/quota errors only', () => {
    // Rotation statuses: 401 (Unauthorized), 402 (Payment/Credits required), 403 (Forbidden/Invalid key), 429 (Rate/Quota limit)
    assert.equal(isRotationStatus(401), true);
    assert.equal(isRotationStatus(402), true);
    assert.equal(isRotationStatus(403), true);
    assert.equal(isRotationStatus(429), true);

    // Non-rotation statuses: must fail fast and not rotate
    assert.equal(isRotationStatus(200), false);
    assert.equal(isRotationStatus(400), false);
    assert.equal(isRotationStatus(404), false);
    assert.equal(isRotationStatus(413), false);
    assert.equal(isRotationStatus(500), false);
    assert.equal(isRotationStatus(503), false);
  });

  await t.test('logKeyRotation logs only the key index, never secret contents', () => {
    const origWarn = console.warn;
    let logged = '';
    console.warn = (...args: any[]) => {
      logged = args.join(' ');
    };
    try {
      logKeyRotation('removebg', 0, 429);
      assert.ok(logged.includes('[apiKeys] removebg key index 0 failed with 429, rotating to index 1'));
      // Must not contain any key literals
      assert.ok(!logged.includes('sk-'));
      assert.ok(!logged.includes('AIza'));
    } finally {
      console.warn = origWarn;
    }
  });

  await t.test('DB multi-key backward compatibility: falls back to legacy single key when list is empty', async () => {
    const sql = getDb();
    // Save state
    const origRows = await sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`;
    const orig = origRows[0];

    try {
      // Set legacy single key and empty list
      await sql`
        UPDATE section_api_keys
        SET
          gemini_active = true,
          gemini_key = 'test-legacy-gemini-single',
          gemini_keys = '[]',
          is_active = true
        WHERE id = 1;
      `;

      // Without env var
      const origEnv = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const keys = await getGeminiKeys();
        assert.ok(keys.includes('test-legacy-gemini-single'), 'Must fallback to legacy single key');
      } finally {
        if (origEnv !== undefined) process.env.GEMINI_API_KEY = origEnv;
      }
    } finally {
      if (orig) {
        await sql`
          UPDATE section_api_keys
          SET
            gemini_active = ${orig.gemini_active},
            gemini_key = ${orig.gemini_key},
            gemini_keys = ${orig.gemini_keys || '[]'}
          WHERE id = 1;
        `;
      }
    }
  });

  await t.test('Multi-key rotation list: returns stored credentials in order and filters dummy masks', async () => {
    const sql = getDb();
    const origRows = await sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`;
    const orig = origRows[0];

    try {
      const testList = ['test-key-alpha', '••••••••', 'test-key-beta', '277226@Asif'];
      await sql`
        UPDATE section_api_keys
        SET
          removebg_active = true,
          removebg_keys = ${JSON.stringify(testList)},
          is_active = true
        WHERE id = 1;
      `;

      const origEnv = process.env.REMOVE_BG_API_KEY;
      delete process.env.REMOVE_BG_API_KEY;
      delete process.env.REMOVEBG_API_KEY;

      try {
        const keys = await getRemoveBgKeys();
        assert.ok(keys.includes('test-key-alpha'));
        assert.ok(keys.includes('test-key-beta'));
        assert.ok(!keys.includes('••••••••'), 'Must filter masked strings');
        assert.ok(!keys.includes('277226@Asif'), 'Must filter passcodes');
      } finally {
        if (origEnv !== undefined) process.env.REMOVE_BG_API_KEY = origEnv;
      }
    } finally {
      if (orig) {
        await sql`
          UPDATE section_api_keys
          SET
            removebg_active = ${orig.removebg_active},
            removebg_key = ${orig.removebg_key},
            removebg_keys = ${orig.removebg_keys || '[]'}
          WHERE id = 1;
        `;
      }
    }
  });

  await t.test('iLovePDF credential pairs: parses list and returns public + secret pairs', async () => {
    const sql = getDb();
    const origRows = await sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`;
    const orig = origRows[0];

    try {
      const pairs = [
        { public: 'project_public_pair_1', secret: 'secret_key_pair_1' },
        { public: 'project_public_pair_2', secret: 'secret_key_pair_2' },
      ];
      await sql`
        UPDATE section_api_keys
        SET
          ilovepdf_active = true,
          ilovepdf_keys = ${JSON.stringify(pairs)},
          is_active = true
        WHERE id = 1;
      `;

      const origEnvPub = process.env.ILOVEPDF_PUBLIC_KEY;
      const origEnvSec = process.env.ILOVEPDF_SECRET_KEY;
      delete process.env.ILOVEPDF_PUBLIC_KEY;
      delete process.env.ILOVEPDF_SECRET_KEY;

      try {
        const creds = await getILovePdfKeys();
        assert.equal(creds.length, 2);
        assert.equal(creds[0].public, 'project_public_pair_1');
        assert.equal(creds[0].secret, 'secret_key_pair_1');
        assert.equal(creds[1].public, 'project_public_pair_2');
        assert.equal(creds[1].secret, 'secret_key_pair_2');
      } finally {
        if (origEnvPub !== undefined) process.env.ILOVEPDF_PUBLIC_KEY = origEnvPub;
        if (origEnvSec !== undefined) process.env.ILOVEPDF_SECRET_KEY = origEnvSec;
      }
    } finally {
      if (orig) {
        await sql`
          UPDATE section_api_keys
          SET
            ilovepdf_active = ${orig.ilovepdf_active},
            ilovepdf_public_key = ${orig.ilovepdf_public_key},
            ilovepdf_secret_key = ${orig.ilovepdf_secret_key},
            ilovepdf_keys = ${orig.ilovepdf_keys || '[]'}
          WHERE id = 1;
        `;
      }
    }
  });

  await t.test('Public Site Data: safeApiKeys exposes flags only and never exposes secret keys or key arrays', async () => {
    const data = await getPublicSiteData();
    assert.ok(data.apiKeys, 'apiKeys must be present');
    const apiKeys = data.apiKeys as Record<string, any>;

    // Ensure all secret keys and multi-key lists are absent
    assert.equal(apiKeys.gemini_key, undefined);
    assert.equal(apiKeys.gemini_keys, undefined);
    assert.equal(apiKeys.openai_key, undefined);
    assert.equal(apiKeys.openai_keys, undefined);
    assert.equal(apiKeys.convertapi_token, undefined);
    assert.equal(apiKeys.convertapi_keys, undefined);
    assert.equal(apiKeys.removebg_key, undefined);
    assert.equal(apiKeys.removebg_keys, undefined);
    assert.equal(apiKeys.ilovepdf_secret_key, undefined);
    assert.equal(apiKeys.ilovepdf_keys, undefined);

    // Only active boolean flags and public key allowed
    assert.equal(typeof apiKeys.is_active, 'boolean');
    assert.equal(typeof apiKeys.gemini_active, 'boolean');
    assert.equal(typeof apiKeys.openai_active, 'boolean');
    assert.equal(typeof apiKeys.convertapi_active, 'boolean');
    assert.equal(typeof apiKeys.removebg_active, 'boolean');
    assert.equal(typeof apiKeys.ilovepdf_active, 'boolean');
    assert.equal(typeof apiKeys.ilovepdf_public_key, 'string');
  });
});
