import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { clearSiteDataCache } from '@/lib/siteData';
import { getAllPolicySections, clearPoliciesCache } from '@/lib/policiesData';
import { clearGuidesCache } from '@/lib/guidesData';
import { clearFaqCache } from '@/lib/faqData';
import { revalidatePath } from 'next/cache';
import { verifyAdminRequest, isAuthSecretDerived } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const session = verifyAdminRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const sql = getDb();

    // Query each section from its own separate table in parallel
    let rows: any;
    try {
      rows = await Promise.all([
        sql`SELECT * FROM section_hero WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_announcement WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_categories ORDER BY display_order ASC`,
        sql`SELECT * FROM section_tools ORDER BY display_order ASC`,
        sql`SELECT * FROM section_footer_social WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_creator_about WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`,
        sql`SELECT slug, count, last_used FROM tool_analytics`,
        sql`SELECT * FROM section_tool_remove_ai_label WHERE id = 1 LIMIT 1`,
      ]);
    } catch {
      await initDatabase();
      rows = await Promise.all([
        sql`SELECT * FROM section_hero WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_announcement WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_categories ORDER BY display_order ASC`,
        sql`SELECT * FROM section_tools ORDER BY display_order ASC`,
        sql`SELECT * FROM section_footer_social WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_creator_about WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`,
        sql`SELECT slug, count, last_used FROM tool_analytics`,
        sql`SELECT * FROM section_tool_remove_ai_label WHERE id = 1 LIMIT 1`,
      ]);
    }

    const [heroRows, announcementRows, categoryRows, toolRows, footerRows, creatorRows, apiKeysRows, analyticsRows, removeAiLabelRows] = rows;

    const analyticsMap: Record<string, number> = {};
    analyticsRows.forEach((r: any) => {
      analyticsMap[r.slug] = Number(r.count || 0);
    });

    let periodicAnalytics: Record<string, { this_week: number; last_week: number; this_month: number; last_month: number }> = {};
    try {
      const periodicRows = await sql`
        SELECT slug,
          COALESCE(SUM(CASE WHEN used_date >= CURRENT_DATE - INTERVAL '6 days' THEN count ELSE 0 END), 0)::int AS this_week,
          COALESCE(SUM(CASE WHEN used_date >= CURRENT_DATE - INTERVAL '13 days' AND used_date < CURRENT_DATE - INTERVAL '6 days' THEN count ELSE 0 END), 0)::int AS last_week,
          COALESCE(SUM(CASE WHEN used_date >= DATE_TRUNC('month', CURRENT_DATE) THEN count ELSE 0 END), 0)::int AS this_month,
          COALESCE(SUM(CASE WHEN used_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND used_date < DATE_TRUNC('month', CURRENT_DATE) THEN count ELSE 0 END), 0)::int AS last_month
        FROM tool_usage_daily
        GROUP BY slug;
      `;
      periodicRows.forEach((r: any) => {
        periodicAnalytics[r.slug] = {
          this_week: Number(r.this_week || 0),
          last_week: Number(r.last_week || 0),
          this_month: Number(r.this_month || 0),
          last_month: Number(r.last_month || 0),
        };
      });
    } catch {}

    const policySections = await getAllPolicySections();

    let guideRows: any[] = [];
    let faqRows: any[] = [];
    try {
      guideRows = await sql`SELECT * FROM content_guides ORDER BY sort_order ASC, slug ASC;`;
      faqRows = await sql`SELECT * FROM content_faq_items ORDER BY scope ASC, sort_order ASC, id ASC;`;
    } catch {}

    return NextResponse.json({
      success: true,
      dbConnected: true,
      isAuthSecretDerived: isAuthSecretDerived(),
      sections: {
        hero: heroRows[0] || null,
        announcement: announcementRows[0] || null,
        categories: categoryRows || [],
        tools: toolRows || [],
        footerSocial: footerRows[0] || null,
        creatorAbout: creatorRows[0] || null,
        apiKeys: apiKeysRows[0] || null,
        removeAiLabel: removeAiLabelRows?.[0] || null,
      },
      policies: policySections,
      guides: guideRows || [],
      faq: faqRows || [],
      analytics: analyticsMap,
      periodicAnalytics,
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
  const session = verifyAdminRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const sql = getDb();
    const body = await req.json();
    const { action, payload } = body;

    function notifyLiveUpdate(message: string, extra: any = {}) {
      clearSiteDataCache();
      clearPoliciesCache();
      clearGuidesCache();
      clearFaqCache();
      try {
        revalidatePath('/', 'page');
        revalidatePath('/', 'layout');
        revalidatePath('/terms', 'page');
        revalidatePath('/terms', 'layout');
        revalidatePath('/privacy', 'page');
        revalidatePath('/privacy', 'layout');
        revalidatePath('/guides', 'page');
        revalidatePath('/guides', 'layout');
        revalidatePath('/guides/[slug]', 'page');
        revalidatePath('/guides/[slug]', 'layout');
        revalidatePath('/faq', 'page');
        revalidatePath('/faq', 'layout');
        revalidatePath('/tools/[slug]', 'page');
        revalidatePath('/tools/[slug]', 'layout');
        revalidatePath('/admin', 'page');
        revalidatePath('/api/public/data');
        revalidatePath('/api/policies');
      } catch (e) {}
      return NextResponse.json(
        { success: true, message, ...extra },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
            'CDN-Cache-Control': 'no-store',
            'Vercel-CDN-Cache-Control': 'no-store',
          },
        }
      );
    }

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
      return notifyLiveUpdate('Hero section updated successfully');
    }

    // 2. Update Announcement section independently
    if (action === 'update_announcement') {
      const { is_active, text_bn, text_en, type, link_url, link_text, duration_days } = payload;
      let expires_at: string | null = null;
      if (duration_days && duration_days !== 'unlimited') {
        const days = parseInt(duration_days, 10);
        if (!isNaN(days) && days > 0) {
          expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }
      }
      await sql`
        UPDATE section_announcement
        SET
          is_active = ${is_active},
          text_bn = ${text_bn},
          text_en = ${text_en},
          type = ${type || 'info'},
          link_url = ${link_url ?? ''},
          link_text = ${link_text ?? ''},
          duration_days = ${duration_days || 'unlimited'},
          expires_at = ${expires_at},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;
      return notifyLiveUpdate('Announcement updated successfully');
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
      return notifyLiveUpdate(`Category ${slug} saved successfully`);
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
      return notifyLiveUpdate(`Category ${slug} updated successfully`);
    }

    if (action === 'delete_category') {
      const { slug } = payload;
      await sql`DELETE FROM section_categories WHERE slug = ${slug};`;
      return notifyLiveUpdate(`Category ${slug} deleted successfully`);
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
      return notifyLiveUpdate(`Tool ${slug} saved successfully`);
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

      if (slug === 'remove-ai-label') {
        try {
          await sql`
            UPDATE section_tool_remove_ai_label
            SET
              name_en = COALESCE(${title_en}, name_en),
              name_bn = COALESCE(${title_bn}, name_bn),
              description_en = COALESCE(${desc_en}, description_en),
              description_bn = COALESCE(${desc_bn}, description_bn),
              enabled = COALESCE(${is_active}, enabled),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = 1;
          `;
        } catch {}
      }

      return notifyLiveUpdate(`Tool ${slug} updated successfully`);
    }

    if (action === 'delete_tool') {
      const { slug } = payload;
      await sql`DELETE FROM section_tools WHERE slug = ${slug};`;
      return notifyLiveUpdate(`Tool ${slug} deleted successfully`);
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
      return notifyLiveUpdate('Footer & Social section updated successfully');
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
      return notifyLiveUpdate('Creator & About section updated successfully');
    }

    // 7. Update API Keys section independently
    if (action === 'update_api_keys') {
      const {
        is_active,
        gemini_active,
        gemini_key,
        convertapi_active,
        convertapi_token,
        removebg_active,
        removebg_key,
        openai_active,
        openai_key,
        ilovepdf_active,
        ilovepdf_public_key,
        ilovepdf_secret_key,
      } = payload;
      
      // Safety guard: never save masked strings (e.g. ••••••••3f9a) to the database
      const sanitizeKey = (keyVal: any) => {
        if (typeof keyVal !== 'string') return keyVal;
        const trimmed = keyVal.trim();
        if (trimmed.startsWith('••') || trimmed.includes('••••')) return undefined;
        return trimmed;
      };

      const safeGeminiKey = sanitizeKey(gemini_key);
      const safeConvertApiToken = sanitizeKey(convertapi_token);
      const safeRemoveBgKey = sanitizeKey(removebg_key);
      const safeOpenAiKey = sanitizeKey(openai_key);
      const safeILovePdfPublicKey = sanitizeKey(ilovepdf_public_key);
      const safeILovePdfSecretKey = sanitizeKey(ilovepdf_secret_key);

      await sql`
        UPDATE section_api_keys
        SET
          is_active = COALESCE(${is_active}, is_active),
          gemini_active = COALESCE(${gemini_active}, gemini_active),
          gemini_key = COALESCE(${safeGeminiKey}, gemini_key),
          convertapi_active = COALESCE(${convertapi_active}, convertapi_active),
          convertapi_token = COALESCE(${safeConvertApiToken}, convertapi_token),
          removebg_active = COALESCE(${removebg_active}, removebg_active),
          removebg_key = COALESCE(${safeRemoveBgKey}, removebg_key),
          openai_active = COALESCE(${openai_active}, openai_active),
          openai_key = COALESCE(${safeOpenAiKey}, openai_key),
          ilovepdf_active = COALESCE(${ilovepdf_active}, ilovepdf_active),
          ilovepdf_public_key = COALESCE(${safeILovePdfPublicKey}, ilovepdf_public_key),
          ilovepdf_secret_key = COALESCE(${safeILovePdfSecretKey}, ilovepdf_secret_key),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;
      return notifyLiveUpdate('API Keys updated successfully');
    }

    // 8. Update UI Settings section independently
    if (action === 'update_ui_settings') {
      const {
        default_theme,
        cursor_animation_type,
        cursor_animation_active,
        background_animation_active,
        high_performance_mode,
      } = payload;
      await sql`
        UPDATE section_ui_settings
        SET
          default_theme = COALESCE(${default_theme}, default_theme),
          cursor_animation_type = COALESCE(${cursor_animation_type}, cursor_animation_type),
          cursor_animation_active = COALESCE(${cursor_animation_active}, cursor_animation_active),
          background_animation_active = COALESCE(${background_animation_active}, background_animation_active),
          high_performance_mode = COALESCE(${high_performance_mode}, high_performance_mode),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;
      return notifyLiveUpdate('UI Settings updated successfully');
    }

    // 9. Update Policy Section independently (Per-section table isolation)
    if (action === 'update_policy_section' || (typeof action === 'string' && action.startsWith('update_policy_'))) {
      const sectionKey = payload?.section || (action === 'update_policy_section' ? payload?.id : action.replace('update_policy_', ''));
      const validTables: Record<string, string> = {
        terms: 'section_policy_terms',
        privacy: 'section_policy_privacy',
        cookies: 'section_policy_cookies',
        disclaimer: 'section_policy_disclaimer',
        ip: 'section_policy_ip',
        third_party: 'section_policy_third_party',
        acceptable_use: 'section_policy_acceptable_use',
        updates: 'section_policy_updates',
        contact: 'section_policy_contact',
      };

      const tableName = validTables[sectionKey];
      if (!tableName) {
        return NextResponse.json({ success: false, error: `Invalid policy section: ${sectionKey}` }, { status: 400 });
      }

      const { title_en, title_bn, body_en, body_bn } = payload;

      await sql.query(`
        INSERT INTO ${tableName} (id, title_en, title_bn, body_en, body_bn)
        VALUES (1, $1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          title_en = EXCLUDED.title_en,
          title_bn = EXCLUDED.title_bn,
          body_en = EXCLUDED.body_en,
          body_bn = EXCLUDED.body_bn,
          updated_at = CURRENT_TIMESTAMP;
      `, [title_en ?? '', title_bn ?? '', body_en ?? '', body_bn ?? '']);

      return notifyLiveUpdate(`Policy section "${sectionKey}" updated successfully`, { section: sectionKey });
    }

    // 10. Update Remove AI Label Tool independently (Dedicated table isolation)
    if (action === 'update_remove_ai_label') {
      const { name_en, name_bn, description_en, description_bn, icon, enabled } = payload;
      await sql`
        INSERT INTO section_tool_remove_ai_label (id, name_en, name_bn, description_en, description_bn, icon, enabled)
        VALUES (
          1,
          ${name_en ?? 'Remove AI Label'},
          ${name_bn ?? 'AI লেবেল রিমুভার'},
          ${description_en ?? 'Remove AI labels & metadata (C2PA, EXIF, XMP) from photos — free, in your browser, no upload.'},
          ${description_bn ?? 'ছবি থেকে AI লেবেল ও মেটাডেটা (C2PA, EXIF, XMP) মুছে ফেলুন — ফ্রি, ব্রাউজারেই, কোনো আপলোড ছাড়াই।'},
          ${icon ?? 'ShieldCheck'},
          ${enabled !== undefined ? enabled : true}
        )
        ON CONFLICT (id) DO UPDATE SET
          name_en = EXCLUDED.name_en,
          name_bn = EXCLUDED.name_bn,
          description_en = EXCLUDED.description_en,
          description_bn = EXCLUDED.description_bn,
          icon = EXCLUDED.icon,
          enabled = EXCLUDED.enabled,
          updated_at = CURRENT_TIMESTAMP;
      `;

      try {
        await sql`
          UPDATE section_tools
          SET
            title_en = ${name_en ?? 'Remove AI Label'},
            title_bn = ${name_bn ?? 'AI লেবেল রিমুভার'},
            desc_en = ${description_en ?? ''},
            desc_bn = ${description_bn ?? ''},
            is_active = ${enabled !== undefined ? enabled : true},
            updated_at = CURRENT_TIMESTAMP
          WHERE slug = 'remove-ai-label';
        `;
      } catch {}

      return notifyLiveUpdate('Remove AI Label tool info updated successfully');
    }

    // 11. Update Single Guide independently (content_guides row isolation)
    if (action === 'update_guide') {
      const {
        slug,
        sort_order,
        enabled,
        category,
        read_minutes,
        title_en,
        title_bn,
        description_en,
        description_bn,
        hero_en,
        hero_bn,
        sections_en,
        sections_bn,
        faq_en,
        faq_bn,
        tool_slug,
        tool_slug_2,
        meta_title,
        meta_description,
        date_published,
      } = payload || {};

      if (!slug) {
        return NextResponse.json({ success: false, error: 'Guide slug is required' }, { status: 400 });
      }

      await sql`
        INSERT INTO content_guides (
          slug, sort_order, enabled, category, read_minutes,
          title_en, title_bn, description_en, description_bn,
          hero_en, hero_bn, sections_en, sections_bn,
          faq_en, faq_bn, tool_slug, tool_slug_2,
          meta_title, meta_description, date_published
        )
        VALUES (
          ${slug},
          ${sort_order ?? 1},
          ${enabled !== undefined ? Boolean(enabled) : true},
          ${category ?? 'practical'},
          ${read_minutes ?? 4},
          ${title_en ?? ''},
          ${title_bn ?? ''},
          ${description_en ?? ''},
          ${description_bn ?? ''},
          ${hero_en ?? ''},
          ${hero_bn ?? ''},
          ${JSON.stringify(sections_en ?? [])}::jsonb,
          ${JSON.stringify(sections_bn ?? [])}::jsonb,
          ${JSON.stringify(faq_en ?? [])}::jsonb,
          ${JSON.stringify(faq_bn ?? [])}::jsonb,
          ${tool_slug ?? null},
          ${tool_slug_2 ?? null},
          ${meta_title ?? null},
          ${meta_description ?? null},
          ${date_published ?? '2026-10-23'}
        )
        ON CONFLICT (slug) DO UPDATE SET
          sort_order = EXCLUDED.sort_order,
          enabled = EXCLUDED.enabled,
          category = EXCLUDED.category,
          read_minutes = EXCLUDED.read_minutes,
          title_en = EXCLUDED.title_en,
          title_bn = EXCLUDED.title_bn,
          description_en = EXCLUDED.description_en,
          description_bn = EXCLUDED.description_bn,
          hero_en = EXCLUDED.hero_en,
          hero_bn = EXCLUDED.hero_bn,
          sections_en = EXCLUDED.sections_en,
          sections_bn = EXCLUDED.sections_bn,
          faq_en = EXCLUDED.faq_en,
          faq_bn = EXCLUDED.faq_bn,
          tool_slug = EXCLUDED.tool_slug,
          tool_slug_2 = EXCLUDED.tool_slug_2,
          meta_title = COALESCE(EXCLUDED.meta_title, content_guides.meta_title),
          meta_description = COALESCE(EXCLUDED.meta_description, content_guides.meta_description),
          date_published = COALESCE(EXCLUDED.date_published, content_guides.date_published),
          updated_at = CURRENT_TIMESTAMP;
      `;

      return notifyLiveUpdate(`Guide "${slug}" updated successfully`, { slug });
    }

    // 12. Update FAQ Scope independently (content_faq_items scope isolation)
    if (action === 'update_faq_scope') {
      const { scope, items } = payload || {};
      if (!scope || !Array.isArray(items)) {
        return NextResponse.json({ success: false, error: 'Scope and items array are required' }, { status: 400 });
      }

      await sql`DELETE FROM content_faq_items WHERE scope = ${scope};`;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await sql`
          INSERT INTO content_faq_items (scope, sort_order, enabled, question_en, question_bn, answer_en, answer_bn)
          VALUES (
            ${scope},
            ${item.sort_order ?? i + 1},
            ${item.enabled !== undefined ? Boolean(item.enabled) : true},
            ${item.question_en ?? ''},
            ${item.question_bn ?? ''},
            ${item.answer_en ?? ''},
            ${item.answer_bn ?? ''}
          );
        `;
      }

      return notifyLiveUpdate(`FAQ scope "${scope}" updated successfully`, { scope });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Database Error in /api/admin/data POST]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
