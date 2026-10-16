import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * -------------------------------------------------------------
 * 1. SSRF & IP Security Validator
 * -------------------------------------------------------------
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const cleanIp = ip.trim().toLowerCase();
  if (cleanIp === '127.0.0.1' || cleanIp === '0.0.0.0' || cleanIp === 'localhost') return true;
  if (cleanIp.startsWith('10.')) return true;
  if (cleanIp.startsWith('192.168.')) return true;
  if (cleanIp.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)) return true;
  if (cleanIp === '::1' || cleanIp === '::' || cleanIp.startsWith('fe80:') || cleanIp.startsWith('fc00:')) return true;
  return false;
}

export function validateSafeUrl(rawUrl: string): { safe: boolean; error?: string; urlObj?: URL } {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, error: 'Only HTTP and HTTPS URLs are supported.' };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost')
    ) {
      return { safe: false, error: 'Access to localhost and internal network addresses is blocked.' };
    }
    if (isPrivateIp(hostname)) {
      return { safe: false, error: 'Access to private and cloud metadata addresses is blocked.' };
    }
    return { safe: true, urlObj: parsed };
  } catch {
    return { safe: false, error: 'Invalid URL format.' };
  }
}

/**
 * -------------------------------------------------------------
 * 2. Strict CORS Manager for Site Origin & Development
 * -------------------------------------------------------------
 */
const ALLOWED_ORIGINS = new Set([
  'https://toolghor.vercel.app',
  'https://toolghor.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export function getCorsHeaders(req: NextRequest, allowedMethods = 'GET, POST, OPTIONS'): Record<string, string> {
  const origin = req.headers.get('origin');
  let allowedOrigin = 'https://toolghor.vercel.app';

  if (!origin) {
    allowedOrigin = '*';
  } else if (
    ALLOWED_ORIGINS.has(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin === process.env.NEXT_PUBLIC_SITE_URL
  ) {
    allowedOrigin = origin;
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCorsPreflight(req: NextRequest, allowedMethods = 'GET, POST, OPTIONS'): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req, allowedMethods),
  });
}

/**
 * -------------------------------------------------------------
 * 3. Persistent Server-Side Rate Limiter (Postgres Table + Cache)
 * -------------------------------------------------------------
 * Generous daily & hourly limits that NEVER block legitimate users,
 * but stop automated infinite loops / wallet draining.
 */
let rateLimitTableInitialized = false;

async function ensureRateLimitTable() {
  if (rateLimitTableInitialized) return;
  try {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS server_rate_limits (
        key VARCHAR(160) PRIMARY KEY,
        count INT NOT NULL DEFAULT 1,
        reset_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `;
    rateLimitTableInitialized = true;
  } catch (err) {
    // If table creation fails, fail open (do not block user)
    console.warn('[RateLimiter Init Warning]:', err);
  }
}

export async function checkPersistentRateLimit(
  key: string,
  limit: number,
  windowSeconds = 86400
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    await ensureRateLimitTable();
    const sql = getDb();
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowSeconds * 1000);

    // Upsert rate limit row with timeout guard
    const query = sql`
      INSERT INTO server_rate_limits (key, count, reset_at)
      VALUES (${key}, 1, ${resetAt.toISOString()})
      ON CONFLICT (key) DO UPDATE
      SET
        count = CASE
          WHEN server_rate_limits.reset_at < CURRENT_TIMESTAMP THEN 1
          ELSE server_rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN server_rate_limits.reset_at < CURRENT_TIMESTAMP THEN ${resetAt.toISOString()}
          ELSE server_rate_limits.reset_at
        END
      RETURNING count, reset_at;
    `;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Rate limit DB timeout')), 1000)
    );

    const rows = (await Promise.race([query, timeoutPromise])) as any[];
    const entry = rows && rows[0];

    if (!entry) return { allowed: true, remaining: limit };

    const currentCount = Number(entry.count || 1);
    const allowed = currentCount <= limit;
    const remaining = Math.max(0, limit - currentCount);

    return { allowed, remaining };
  } catch (err: any) {
    // Zero regression guarantee: fail open if DB is slow or unavailable
    console.warn('[RateLimiter Fail-Open Warning]:', err?.message);
    return { allowed: true, remaining: limit };
  }
}

/**
 * -------------------------------------------------------------
 * 4. Content-Disposition Filename Sanitizer
 * -------------------------------------------------------------
 * Mitigates header injection (CRLF / unescaped quotes).
 */
export function sanitizeContentDisposition(filename: string, defaultName = 'output'): string {
  // Safe ASCII-only fallback (letters, numbers, dot, underscore, dash)
  const safeAscii = filename
    .replace(/[\r\n"\\;=]/g, '')
    .replace(/[^A-Za-z0-9._\-]/g, '_')
    .trim() || defaultName;

  // RFC 5987 UTF-8 encoded filename for modern browsers supporting Unicode/Bengali
  const encodedUtf8 = encodeURIComponent(filename.replace(/[\r\n]/g, '').trim() || defaultName);

  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodedUtf8}`;
}
