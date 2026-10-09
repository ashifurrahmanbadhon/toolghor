import { getDb, initDatabase } from '@/lib/db';

export async function getPublicSiteData() {
  try {
    await initDatabase();
    const sql = getDb();

    // Query all sections in parallel directly from Neon PostgreSQL
    const [heroRows, announcementRows, categoryRows, toolRows, footerRows, creatorRows, apiKeysRows] =
      await Promise.all([
        sql`SELECT is_active, tagline_bn, tagline_en, search_placeholder_bn, search_placeholder_en FROM section_hero WHERE id = 1 LIMIT 1`,
        sql`SELECT is_active, text_bn, text_en, type FROM section_announcement WHERE id = 1 LIMIT 1`,
        sql`SELECT slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol FROM section_categories ORDER BY display_order ASC`,
        sql`SELECT slug, category_slug, is_active, title_bn, title_en, desc_bn, desc_en, badge FROM section_tools ORDER BY display_order ASC`,
        sql`SELECT * FROM section_footer_social WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_creator_about WHERE id = 1 LIMIT 1`,
        sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`,
      ]);

    return {
      success: true,
      hero: heroRows[0] || null,
      announcement: announcementRows[0] || null,
      categories: categoryRows || [],
      tools: toolRows || [],
      footerSocial: footerRows[0] || null,
      creatorAbout: creatorRows[0] || null,
      apiKeys: apiKeysRows[0] || null,
    };
  } catch (error: any) {
    console.error('[Database Error in getPublicSiteData]:', error);
    return null;
  }
}
