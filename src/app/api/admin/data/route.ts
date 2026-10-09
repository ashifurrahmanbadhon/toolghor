import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const sql = getDb();

    // Query each section from its own separate table
    const [heroRows, announcementRows, categoryRows, toolRows, footerRows, creatorRows, apiKeysRows, analyticsRows] =
      await Promise.all([
        sql`SELECT * FROM section_hero WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_announcement WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_categories ORDER BY display_order ASC`,
        sql`SELECT * FROM section_tools ORDER BY display_order ASC`,
        sql`SELECT * FROM section_footer_social WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_creator_about WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`,
        sql`SELECT slug, count, last_used FROM tool_analytics`,
      ]);

    const analyticsMap: Record<string, number> = {};
    analyticsRows.forEach((r: any) => {
      analyticsMap[r.slug] = Number(r.count || 0);
    });

    return NextResponse.json({
      success: true,
      dbConnected: true,
      sections: {
        hero: heroRows[0] || null,
        announcement: announcementRows[0] || null,
        categories: categoryRows || [],
        tools: toolRows || [],
        footerSocial: footerRows[0] || null,
        creatorAbout: creatorRows[0] || null,
        apiKeys: apiKeysRows[0] || null,
      },
      analytics: analyticsMap,
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

    // 1. Update Hero section independently
    if (action === 'update_hero') {
      const { is_active, tagline_bn, tagline_en, search_placeholder_bn, search_placeholder_en } = payload;
      await sql`
        UPDATE section_hero
        SET
          is_active = ${is_active},
          tagline_bn = ${tagline_bn},
          tagline_en = ${tagline_en},
          search_placeholder_bn = ${search_placeholder_bn},
          search_placeholder_en = ${search_placeholder_en},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;
      return NextResponse.json({ success: true, message: 'Hero section updated successfully' });
    }

    // 2. Update Announcement section independently
    if (action === 'update_announcement') {
      const { is_active, text_bn, text_en, type } = payload;
      await sql`
        UPDATE section_announcement
        SET
          is_active = ${is_active},
          text_bn = ${text_bn},
          text_en = ${text_en},
          type = ${type || 'info'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;
      return NextResponse.json({ success: true, message: 'Announcement updated successfully' });
    }

    // 3. Category Operations
    if (action === 'create_category') {
      const { slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol } = payload;
      await sql`
        INSERT INTO section_categories (slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol, display_order)
        VALUES (
          ${slug},
          ${is_active !== undefined ? is_active : true},
          ${title_bn || title_en || ''},
          ${title_en || ''},
          ${desc_bn || desc_en || ''},
          ${desc_en || ''},
          ${symbol || '📁'},
          (SELECT COALESCE(MAX(display_order), 0) + 1 FROM section_categories)
        )
        ON CONFLICT (slug) DO UPDATE SET
          title_en = EXCLUDED.title_en,
          title_bn = EXCLUDED.title_bn,
          desc_en = EXCLUDED.desc_en,
          desc_bn = EXCLUDED.desc_bn,
          symbol = EXCLUDED.symbol,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP;
      `;
      return NextResponse.json({ success: true, message: `Category ${slug} saved successfully` });
    }

    if (action === 'update_category') {
      const { slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol } = payload;
      await sql`
        UPDATE section_categories
        SET
          is_active = COALESCE(${is_active}, is_active),
          title_bn = COALESCE(${title_bn}, title_bn),
          title_en = COALESCE(${title_en}, title_en),
          desc_bn = COALESCE(${desc_bn}, desc_bn),
          desc_en = COALESCE(${desc_en}, desc_en),
          symbol = COALESCE(${symbol}, symbol),
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = ${slug};
      `;
      return NextResponse.json({ success: true, message: `Category ${slug} updated successfully` });
    }

    if (action === 'delete_category') {
      const { slug } = payload;
      await sql`DELETE FROM section_categories WHERE slug = ${slug};`;
      return NextResponse.json({ success: true, message: `Category ${slug} deleted successfully` });
    }

    // 4. Tool Operations
    if (action === 'create_tool') {
      const { slug, category_slug, is_active, badge, title_bn, title_en, desc_bn, desc_en } = payload;
      await sql`
        INSERT INTO section_tools (slug, category_slug, is_active, title_bn, title_en, desc_bn, desc_en, badge, display_order)
        VALUES (
          ${slug},
          ${category_slug || 'text-tools'},
          ${is_active !== undefined ? is_active : true},
          ${title_bn || title_en || ''},
          ${title_en || ''},
          ${desc_bn || desc_en || ''},
          ${desc_en || ''},
          ${badge || ''},
          (SELECT COALESCE(MAX(display_order), 0) + 1 FROM section_tools)
        )
        ON CONFLICT (slug) DO UPDATE SET
          category_slug = EXCLUDED.category_slug,
          title_en = EXCLUDED.title_en,
          title_bn = EXCLUDED.title_bn,
          desc_en = EXCLUDED.desc_en,
          desc_bn = EXCLUDED.desc_bn,
          badge = EXCLUDED.badge,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP;
      `;
      return NextResponse.json({ success: true, message: `Tool ${slug} saved successfully` });
    }

    if (action === 'update_tool') {
      const { slug, category_slug, is_active, badge, title_bn, title_en, desc_bn, desc_en } = payload;
      await sql`
        UPDATE section_tools
        SET
          is_active = COALESCE(${is_active}, is_active),
          category_slug = COALESCE(${category_slug}, category_slug),
          badge = COALESCE(${badge}, badge),
          title_bn = COALESCE(${title_bn}, title_bn),
          title_en = COALESCE(${title_en}, title_en),
          desc_bn = COALESCE(${desc_bn}, desc_bn),
          desc_en = COALESCE(${desc_en}, desc_en),
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = ${slug};
      `;
      return NextResponse.json({ success: true, message: `Tool ${slug} updated successfully` });
    }

    if (action === 'delete_tool') {
      const { slug } = payload;
      await sql`DELETE FROM section_tools WHERE slug = ${slug};`;
      return NextResponse.json({ success: true, message: `Tool ${slug} deleted successfully` });
    }

    // 5. Update Footer & Social section independently
    if (action === 'update_footer_social') {
      const {
        is_active,
        copyright_text_bn,
        copyright_text_en,
        whatsapp_active,
        whatsapp_number,
        whatsapp_text_bn,
        whatsapp_text_en,
        facebook_active,
        facebook_url,
        linkedin_active,
        linkedin_url,
        github_active,
        github_url,
      } = payload;
      await sql`
        UPDATE section_footer_social
        SET
          is_active = COALESCE(${is_active}, is_active),
          copyright_text_bn = COALESCE(${copyright_text_bn}, copyright_text_bn),
          copyright_text_en = COALESCE(${copyright_text_en}, copyright_text_en),
          whatsapp_active = COALESCE(${whatsapp_active}, whatsapp_active),
          whatsapp_number = COALESCE(${whatsapp_number}, whatsapp_number),
          whatsapp_text_bn = COALESCE(${whatsapp_text_bn}, whatsapp_text_bn),
          whatsapp_text_en = COALESCE(${whatsapp_text_en}, whatsapp_text_en),
          facebook_active = COALESCE(${facebook_active}, facebook_active),
          facebook_url = COALESCE(${facebook_url}, facebook_url),
          linkedin_active = COALESCE(${linkedin_active}, linkedin_active),
          linkedin_url = COALESCE(${linkedin_url}, linkedin_url),
          github_active = COALESCE(${github_active}, github_active),
          github_url = COALESCE(${github_url}, github_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;
      return NextResponse.json({ success: true, message: 'Footer & Social section updated successfully' });
    }

    // 6. Update Creator & About section independently
    if (action === 'update_creator_about') {
      const { is_active, name, role_bn, role_en, email_active, email, bio_bn, bio_en, social_active, facebook_url, linkedin_url, github_url } = payload;
      await sql`
        UPDATE section_creator_about
        SET
          is_active = COALESCE(${is_active}, is_active),
          name = COALESCE(${name}, name),
          role_bn = COALESCE(${role_bn}, role_bn),
          role_en = COALESCE(${role_en}, role_en),
          email_active = COALESCE(${email_active}, email_active),
          email = COALESCE(${email}, email),
          bio_bn = COALESCE(${bio_bn}, bio_bn),
          bio_en = COALESCE(${bio_en}, bio_en),
          social_active = COALESCE(${social_active}, social_active),
          facebook_url = COALESCE(${facebook_url}, facebook_url),
          linkedin_url = COALESCE(${linkedin_url}, linkedin_url),
          github_url = COALESCE(${github_url}, github_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;
      return NextResponse.json({ success: true, message: 'Creator & About section updated successfully' });
    }

    // 7. Update API Keys section independently
    if (action === 'update_api_keys') {
      const { is_active, gemini_active, gemini_key, convertapi_active, convertapi_token, removebg_active, removebg_key, openai_active, openai_key } = payload;
      await sql`
        UPDATE section_api_keys
        SET
          is_active = COALESCE(${is_active}, is_active),
          gemini_active = COALESCE(${gemini_active}, gemini_active),
          gemini_key = COALESCE(${gemini_key}, gemini_key),
          convertapi_active = COALESCE(${convertapi_active}, convertapi_active),
          convertapi_token = COALESCE(${convertapi_token}, convertapi_token),
          removebg_active = COALESCE(${removebg_active}, removebg_active),
          removebg_key = COALESCE(${removebg_key}, removebg_key),
          openai_active = COALESCE(${openai_active}, openai_active),
          openai_key = COALESCE(${openai_key}, openai_key),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;
      return NextResponse.json({ success: true, message: 'API Keys updated successfully' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Database Error in /api/admin/data POST]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
