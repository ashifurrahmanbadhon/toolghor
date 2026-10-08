import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { TOOLS } from '@/data/registry';

export async function GET() {
  try {
    await initDatabase();
    const sql = getDb();

    // Fetch tool statuses
    const rows = await sql`SELECT slug, is_active, badge FROM tool_statuses`;
    const toolStatuses: Record<string, boolean> = {};
    TOOLS.forEach((t) => {
      toolStatuses[t.slug] = true; // default true
    });
    rows.forEach((r: any) => {
      toolStatuses[r.slug] = r.is_active;
    });

    // Fetch settings
    const settingsRows = await sql`SELECT key, value FROM site_settings`;
    const settings: Record<string, any> = {};
    settingsRows.forEach((r: any) => {
      settings[r.key] = r.value;
    });

    // Fetch analytics
    const analyticsRows = await sql`SELECT slug, count, last_used FROM tool_analytics`;
    const analytics: Record<string, number> = {};
    analyticsRows.forEach((r: any) => {
      analytics[r.slug] = Number(r.count);
    });

    return NextResponse.json({
      success: true,
      dbConnected: true,
      toolStatuses,
      settings,
      analytics,
    });
  } catch (error: any) {
    console.error('[Database Error in /api/admin/data GET]:', error);
    return NextResponse.json(
      {
        success: false,
        dbConnected: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const sql = getDb();
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'update_tool') {
      const { slug, is_active } = payload;
      await sql`
        INSERT INTO tool_statuses (slug, is_active, updated_at)
        VALUES (${slug}, ${is_active}, CURRENT_TIMESTAMP)
        ON CONFLICT (slug)
        DO UPDATE SET is_active = ${is_active}, updated_at = CURRENT_TIMESTAMP;
      `;
      return NextResponse.json({ success: true, message: 'Tool status updated in database' });
    }

    if (action === 'update_setting') {
      const { key, value } = payload;
      await sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (key)
        DO UPDATE SET value = ${JSON.stringify(value)}::jsonb, updated_at = CURRENT_TIMESTAMP;
      `;
      return NextResponse.json({ success: true, message: 'Setting saved in database' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Database Error in /api/admin/data POST]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
