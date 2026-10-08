import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug required' }, { status: 400 });
    }

    await initDatabase();
    const sql = getDb();

    await sql`
      INSERT INTO tool_analytics (slug, count, last_used)
      VALUES (${slug}, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (slug)
      DO UPDATE SET count = tool_analytics.count + 1, last_used = CURRENT_TIMESTAMP;
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Analytics Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
