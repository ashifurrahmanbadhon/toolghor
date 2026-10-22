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
      sql`SELECT is_active, text_bn, text_en, type, link_url, link_text FROM section_announcement WHERE id = 1 LIMIT 1`.catch(() => sql`SELECT is_active, text_bn, text_en, type FROM section_announcement WHERE id = 1 LIMIT 1`),
      sql`SELECT slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol FROM section_categories ORDER BY display_order ASC`,
      sql`SELECT slug, category_slug, is_active, title_bn, title_en, desc_bn, desc_en, badge FROM section_tools ORDER BY display_order ASC`,
      sql`SELECT * FROM section_footer_social WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_creator_about WHERE id = 1 LIMIT 1`,
      sql`SELECT is_active, gemini_active, openai_active, convertapi_active, removebg_active, ilovepdf_active, ilovepdf_public_key FROM section_api_keys WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_ui_settings WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_tool_remove_ai_label WHERE id = 1 LIMIT 1`.catch(() => []),
    ]);

    const [heroRows, announcementRows, categoryRows, toolRows, footerRows, creatorRows, apiKeysRows, uiSettingsRows, removeAiRows] =
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

    let policySections = null;
    try {
      const { getAllPolicySections } = await import('@/lib/policiesData');
      policySections = await getAllPolicySections();
    } catch {}

    const removeAiRow = (removeAiRows && removeAiRows[0]) || null;
    const mergedTools = [...(toolRows || [])];

    if (removeAiRow && removeAiRow.enabled !== false) {
      const removeAiTool = {
        slug: 'remove-ai-label',
        category_slug: 'images',
        is_active: true,
        title_bn: removeAiRow.name_bn || 'AI লেবেল রিমুভার',
        title_en: removeAiRow.name_en || 'Remove AI Label',
        desc_bn: removeAiRow.description_bn || 'ছবি থেকে AI লেবেল ও মেটাডেটা (C2PA, EXIF, XMP) মুছে ফেলুন — ফ্রি, ব্রাউজারেই, কোনো আপলোড ছাড়াই।',
        desc_en: removeAiRow.description_en || 'Remove AI labels & metadata (C2PA, EXIF, XMP) from photos — free, in your browser, no upload.',
        badge: 'New',
      };

      // Position as the last tool in the Image Tools category
      let lastImageIdx = -1;
      for (let i = 0; i < mergedTools.length; i++) {
        if (mergedTools[i].category_slug === 'images') {
          lastImageIdx = i;
        }
      }
      if (lastImageIdx >= 0) {
        mergedTools.splice(lastImageIdx + 1, 0, removeAiTool);
      } else {
        mergedTools.push(removeAiTool);
      }
    }

    const data = {
      success: true,
      hero: heroRows[0] || null,
      announcement: announcementRows[0] || null,
      categories: categoryRows || [],
      tools: mergedTools,
      footerSocial: footerRows[0] || null,
      creatorAbout: creatorRows[0] || null,
      apiKeys: safeApiKeys,
      uiSettings: uiSettingsRows[0] || null,
      policies: policySections,
      removeAiLabel: removeAiRow,
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

