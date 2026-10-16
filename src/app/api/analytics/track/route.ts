import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { TOOLS } from '@/data/registry';

const VALID_SLUGS = new Set(TOOLS.map((t) => t.slug));

// In-memory sliding window rate limiter: max 60 hits/min per IP
const ipTrackMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipTrackMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipTrackMap.set(ip, { count: 1, expiresAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count += 1;
  return true;
}

let tableReady = false;

async function ensureAnalyticsTable() {
  if (tableReady) return;
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS tool_analytics (
      slug VARCHAR(100) PRIMARY KEY,
      count INT NOT NULL DEFAULT 0,
      last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  tableReady = true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';

    if (!slug || !VALID_SLUGS.has(slug)) {
      return NextResponse.json({ success: false, error: 'Invalid tool slug' }, { status: 400 });
    }

    await ensureAnalyticsTable();
    const sql = getDb();

    await sql`
      INSERT INTO tool_analytics (slug, count, last_used)
      VALUES (${slug}, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (slug)
      DO UPDATE SET count = tool_analytics.count + 1, last_used = CURRENT_TIMESTAMP;
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Analytics Track Exception]:', err?.message);
    // Generic error response - never leak database internals or SQL error details
    return NextResponse.json({ success: false, error: 'Unable to record analytics' }, { status: 500 });
  }
}
