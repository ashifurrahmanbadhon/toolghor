import { getDb } from '@/lib/db';

let cachedSiteData: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds in-memory cache

export async function getPublicSiteData() {
  const now = Date.now();
  if (cachedSiteData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedSiteData;
  }

  try {
    const sql = getDb();

    // Query all sections in parallel with a fast 1500ms timeout fallback
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB Query Timeout')), 1500)
    );

    const queryPromise = Promise.all([
      sql`SELECT is_active, tagline_bn, tagline_en, search_placeholder_bn, search_placeholder_en FROM section_hero WHERE id = 1 LIMIT 1`,
      sql`SELECT is_active, text_bn, text_en, type FROM section_announcement WHERE id = 1 LIMIT 1`,
      sql`SELECT slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol FROM section_categories ORDER BY display_order ASC`,
      sql`SELECT slug, category_slug, is_active, title_bn, title_en, desc_bn, desc_en, badge FROM section_tools ORDER BY display_order ASC`,
      sql`SELECT * FROM section_footer_social WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_creator_about WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`,
    ]);

    const [heroRows, announcementRows, categoryRows, toolRows, footerRows, creatorRows, apiKeysRows] =
      (await Promise.race([queryPromise, timeoutPromise])) as any;

    const data = {
      success: true,
      hero: heroRows[0] || null,
      announcement: announcementRows[0] || null,
      categories: categoryRows || [],
      tools: toolRows || [],
      footerSocial: footerRows[0] || null,
      creatorAbout: creatorRows[0] || null,
      apiKeys: apiKeysRows[0] || null,
    };

    cachedSiteData = data;
    lastCacheTime = now;
    return data;
  } catch (error: any) {
    console.warn('[getPublicSiteData Notice]: Serving cached/default site data. Reason:', error?.message);
    if (cachedSiteData) return cachedSiteData;
    return null;
  }
}
