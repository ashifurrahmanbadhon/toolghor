import { getDb } from '@/lib/db';

let cachedSiteData: any = null;

export async function getPublicSiteData() {

  try {
    const sql = getDb();

    // Query all sections in parallel with reliable 4000ms timeout fallback for instant page loads
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB Query Timeout')), 4000)
    );

    const queryPromise = Promise.all([
      sql`SELECT is_active, tagline_bn, tagline_en, search_placeholder_bn, search_placeholder_en FROM section_hero WHERE id = 1 LIMIT 1`,
      sql`SELECT is_active, text_bn, text_en, type FROM section_announcement WHERE id = 1 LIMIT 1`,
      sql`SELECT slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol FROM section_categories ORDER BY display_order ASC`,
      sql`SELECT slug, category_slug, is_active, title_bn, title_en, desc_bn, desc_en, badge FROM section_tools ORDER BY display_order ASC`,
      sql`SELECT * FROM section_footer_social WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_creator_about WHERE id = 1 LIMIT 1`,
      sql`SELECT is_active, gemini_active, openai_active, convertapi_active, removebg_active, ilovepdf_active, ilovepdf_public_key FROM section_api_keys WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_ui_settings WHERE id = 1 LIMIT 1`,
    ]);

    const [heroRows, announcementRows, categoryRows, toolRows, footerRows, creatorRows, apiKeysRows, uiSettingsRows] =
      (await Promise.race([queryPromise, timeoutPromise])) as any;

    const rawApi = apiKeysRows[0] || null;
    const safeApiKeys = rawApi
      ? {
          is_active: Boolean(rawApi.is_active),
          gemini_active: Boolean(rawApi.gemini_active),
          openai_active: Boolean(rawApi.openai_active),
          convertapi_active: Boolean(rawApi.convertapi_active),
          removebg_active: Boolean(rawApi.removebg_active),
          ilovepdf_active: Boolean(rawApi.ilovepdf_active),
          ilovepdf_public_key: (rawApi.ilovepdf_public_key || '').trim(),
        }
      : null;

    const data = {
      success: true,
      hero: heroRows[0] || null,
      announcement: announcementRows[0] || null,
      categories: categoryRows || [],
      tools: toolRows || [],
      footerSocial: footerRows[0] || null,
      creatorAbout: creatorRows[0] || null,
      apiKeys: safeApiKeys,
      uiSettings: uiSettingsRows[0] || null,
    };

    cachedSiteData = data;
    return data;
  } catch (error: any) {
    console.warn('[getPublicSiteData Notice]: Serving cached/default site data. Reason:', error?.message);
    if (cachedSiteData) return cachedSiteData;
    return null;
  }
}

export function clearSiteDataCache() {
  cachedSiteData = null;
}

