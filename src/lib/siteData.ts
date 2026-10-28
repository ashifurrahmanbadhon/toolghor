import { getDb } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { DEFAULT_CONTENT_TEXTS, mergeContentTexts, ContentTexts } from '@/data/contentTexts';

let cachedSiteData: any = null;

async function fetchRawSiteData() {
  try {
    const sql = getDb();

    // Query all sections in parallel with reliable 4000ms timeout fallback for instant page loads
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB Query Timeout')), 4000)
    );

    const queryPromise = Promise.all([
      sql`SELECT is_active, tagline_bn, tagline_en, search_placeholder_bn, search_placeholder_en FROM section_hero WHERE id = 1 LIMIT 1`,
      sql`SELECT is_active, text_bn, text_en, type, link_url, link_text, duration_days, expires_at FROM section_announcement WHERE id = 1 LIMIT 1`.catch(() => sql`SELECT is_active, text_bn, text_en, type FROM section_announcement WHERE id = 1 LIMIT 1`),
      sql`SELECT slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol FROM section_categories ORDER BY display_order ASC`,
      sql`SELECT slug, category_slug, is_active, title_bn, title_en, desc_bn, desc_en, badge, updated_at FROM section_tools ORDER BY display_order ASC`,
      sql`SELECT * FROM section_footer_social WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_creator_about WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_api_keys WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_ui_settings WHERE id = 1 LIMIT 1`,
      sql`SELECT * FROM section_tool_remove_ai_label WHERE id = 1 LIMIT 1`.catch(() => []),
      sql`SELECT key, value FROM site_settings WHERE key = 'content_texts' LIMIT 1`.catch(() => []),
    ]);

    const [heroRows, announcementRows, categoryRows, toolRows, footerRows, creatorRows, apiKeysRows, uiSettingsRows, removeAiRows, siteSettingsRows] =
      (await Promise.race([queryPromise, timeoutPromise])) as any;

    const rawApi = apiKeysRows[0] || null;
    let safeApiKeys = null;
    if (rawApi) {
      const parseListCount = (val: any) => {
        if (Array.isArray(val)) return val.length;
        if (typeof val === 'string' && val.trim()) {
          try {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) return arr.filter(Boolean).length;
          } catch {}
        }
        return 0;
      };

      const hasGemini = Boolean(
        (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && !process.env.GEMINI_API_KEY.includes('your_')) ||
        parseListCount(rawApi.gemini_keys) > 0 ||
        (rawApi.gemini_key && rawApi.gemini_key.trim())
      );
      const hasOpenai = Boolean(
        (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() && !process.env.OPENAI_API_KEY.includes('your_')) ||
        parseListCount(rawApi.openai_keys) > 0 ||
        (rawApi.openai_key && rawApi.openai_key.trim())
      );
      const hasConvertApi = Boolean(
        (process.env.CONVERTAPI_TOKEN && process.env.CONVERTAPI_TOKEN.trim() && !process.env.CONVERTAPI_TOKEN.includes('your_')) ||
        (process.env.CONVERTAPI_SECRET && process.env.CONVERTAPI_SECRET.trim() && !process.env.CONVERTAPI_SECRET.includes('your_')) ||
        parseListCount(rawApi.convertapi_keys) > 0 ||
        (rawApi.convertapi_token && rawApi.convertapi_token.trim())
      );
      const hasRemoveBg = Boolean(
        (process.env.REMOVE_BG_API_KEY && process.env.REMOVE_BG_API_KEY.trim() && !process.env.REMOVE_BG_API_KEY.includes('your_')) ||
        (process.env.REMOVEBG_API_KEY && process.env.REMOVEBG_API_KEY.trim() && !process.env.REMOVEBG_API_KEY.includes('your_')) ||
        parseListCount(rawApi.removebg_keys) > 0 ||
        (rawApi.removebg_key && rawApi.removebg_key.trim())
      );

      let firstILovePdfPublicKey = (rawApi.ilovepdf_public_key || process.env.ILOVEPDF_PUBLIC_KEY || '').trim();
      const iLovePdfList = (() => {
        if (Array.isArray(rawApi.ilovepdf_keys)) return rawApi.ilovepdf_keys;
        if (typeof rawApi.ilovepdf_keys === 'string' && rawApi.ilovepdf_keys.trim()) {
          try { return JSON.parse(rawApi.ilovepdf_keys); } catch {}
        }
        return [];
      })();
      if (Array.isArray(iLovePdfList) && iLovePdfList.length > 0 && (iLovePdfList[0]?.public || iLovePdfList[0]?.publicKey)) {
        firstILovePdfPublicKey = (iLovePdfList[0].public || iLovePdfList[0].publicKey || '').trim();
      }

      const hasILovePdf = Boolean(
        firstILovePdfPublicKey ||
        (rawApi.ilovepdf_secret_key && rawApi.ilovepdf_secret_key.trim()) ||
        (process.env.ILOVEPDF_SECRET_KEY && process.env.ILOVEPDF_SECRET_KEY.trim()) ||
        (Array.isArray(iLovePdfList) && iLovePdfList.length > 0)
      );

      safeApiKeys = {
        is_active: Boolean(rawApi.is_active),
        gemini_active: Boolean(rawApi.gemini_active && hasGemini),
        openai_active: Boolean(rawApi.openai_active && hasOpenai),
        convertapi_active: Boolean(rawApi.convertapi_active && hasConvertApi),
        removebg_active: Boolean(rawApi.removebg_active && hasRemoveBg),
        ilovepdf_active: Boolean(rawApi.ilovepdf_active && hasILovePdf),
        ilovepdf_public_key: firstILovePdfPublicKey,
      };
    }

    let policySections = null;
    try {
      const { getAllPolicySections } = await import('@/lib/policiesData');
      policySections = await getAllPolicySections();
    } catch {}

    const removeAiRow = (removeAiRows && removeAiRows[0]) || null;
    let mergedTools = [...(toolRows || [])];

    if (removeAiRow) {
      const existingIdx = mergedTools.findIndex((t: any) => t.slug === 'remove-ai-label');
      if (existingIdx >= 0) {
        mergedTools[existingIdx] = {
          ...mergedTools[existingIdx],
          is_active: removeAiRow.enabled !== false,
          title_bn: removeAiRow.name_bn || mergedTools[existingIdx].title_bn,
          title_en: removeAiRow.name_en || mergedTools[existingIdx].title_en,
          desc_bn: removeAiRow.description_bn || mergedTools[existingIdx].desc_bn,
          desc_en: removeAiRow.description_en || mergedTools[existingIdx].desc_en,
        };
      } else if (removeAiRow.enabled !== false) {
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
    }

    const annRow = announcementRows[0] || null;
    if (annRow && annRow.expires_at) {
      if (new Date(annRow.expires_at).getTime() <= Date.now()) {
        annRow.is_active = false;
      }
    }

    const rawContentTexts = siteSettingsRows?.[0]?.value || null;
    const contentTexts: ContentTexts = mergeContentTexts(rawContentTexts);

    const data = {
      success: true,
      hero: heroRows[0] || null,
      announcement: annRow,
      categories: categoryRows || [],
      tools: mergedTools,
      footerSocial: footerRows[0] || null,
      creatorAbout: creatorRows[0] || null,
      apiKeys: safeApiKeys,
      uiSettings: uiSettingsRows[0] || null,
      policies: policySections,
      removeAiLabel: removeAiRow,
      contentTexts,
    };

    cachedSiteData = data;
    return data;
  } catch (error: any) {
    console.warn('[getPublicSiteData Notice]: Serving cached/default site data. Reason:', error?.message);
    if (cachedSiteData) return cachedSiteData;
    return {
      success: true,
      hero: null,
      announcement: null,
      categories: [],
      tools: [],
      footerSocial: null,
      creatorAbout: null,
      apiKeys: null,
      uiSettings: null,
      policies: null,
      removeAiLabel: null,
      contentTexts: DEFAULT_CONTENT_TEXTS,
    };
  }
}

// Next.js Data Cache with tag 'site-content' and 1 hour TTL backstop
const getCachedPublicSiteData = unstable_cache(
  fetchRawSiteData,
  ['site-content-cache'],
  { tags: ['site-content'], revalidate: 3600 }
);

// React cache() wrapper for per-request de-duplication on multi-read pages
export const getPublicSiteData = cache(async () => {
  try {
    return await getCachedPublicSiteData();
  } catch (error: any) {
    console.warn('[getPublicSiteData Cache Catch]: Falling back to in-memory/defaults:', error?.message);
    return cachedSiteData || (await fetchRawSiteData());
  }
});

export function clearSiteDataCache() {
  cachedSiteData = null;
}
