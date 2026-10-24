import { getDb } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { GUIDES, GUIDES_BY_SLUG, Guide, GuideSection } from '@/data/guides';
import { FaqItem } from '@/data/seoData';

let cachedGuides: Guide[] | null = null;

function rowToGuide(row: any): Guide {
  const defaultGuide = GUIDES_BY_SLUG[row.slug];
  const sections_en = Array.isArray(row.sections_en) ? row.sections_en : (defaultGuide?.sections || []);
  const sections_bn = Array.isArray(row.sections_bn) ? row.sections_bn : (defaultGuide?.sections || []);

  const maxSections = Math.max(sections_en.length, sections_bn.length);
  const combinedSections: GuideSection[] = [];
  for (let i = 0; i < maxSections; i++) {
    const s_en = sections_en[i] || {};
    const s_bn = sections_bn[i] || {};
    const defS = defaultGuide?.sections?.[i];

    combinedSections.push({
      heading: {
        en: s_en.heading || defS?.heading.en || '',
        bn: s_bn.heading || defS?.heading.bn || '',
      },
      paragraphs: (s_en.paragraphs || defS?.paragraphs?.en) ? {
        en: s_en.paragraphs || defS?.paragraphs?.en || [],
        bn: s_bn.paragraphs || defS?.paragraphs?.bn || [],
      } : undefined,
      bullets: (s_en.bullets || defS?.bullets?.en) ? {
        en: s_en.bullets || defS?.bullets?.en || [],
        bn: s_bn.bullets || defS?.bullets?.bn || [],
      } : undefined,
      steps: (s_en.steps || defS?.steps?.en) ? {
        en: s_en.steps || defS?.steps?.en || [],
        bn: s_bn.steps || defS?.steps?.bn || [],
      } : undefined,
      paragraphsAfter: (s_en.paragraphsAfter || defS?.paragraphsAfter?.en) ? {
        en: s_en.paragraphsAfter || defS?.paragraphsAfter?.en || [],
        bn: s_bn.paragraphsAfter || defS?.paragraphsAfter?.bn || [],
      } : undefined,
      cta: s_en.cta ? {
        toolSlug: s_en.cta.toolSlug,
        label: {
          en: s_en.cta.label || defS?.cta?.label.en || '',
          bn: s_bn.cta?.label || defS?.cta?.label.bn || s_en.cta.label || '',
        },
      } : defS?.cta,
    });
  }

  const faq_en = Array.isArray(row.faq_en) ? row.faq_en : [];
  const faq_bn = Array.isArray(row.faq_bn) ? row.faq_bn : [];
  const maxFaq = Math.max(faq_en.length, faq_bn.length);
  const combinedFaq: FaqItem[] = [];
  for (let i = 0; i < maxFaq; i++) {
    const f_en = faq_en[i] || {};
    const f_bn = faq_bn[i] || {};
    const defF = defaultGuide?.faq?.[i];
    combinedFaq.push({
      en: { q: f_en.q || defF?.en.q || '', a: f_en.a || defF?.en.a || '' },
      bn: { q: f_bn.q || defF?.bn.q || '', a: f_bn.a || defF?.bn.a || '' },
    });
  }

  const hero_en_paras = row.hero_en ? row.hero_en.split('\n\n').filter(Boolean) : (defaultGuide?.intro.en || []);
  const hero_bn_paras = row.hero_bn ? row.hero_bn.split('\n\n').filter(Boolean) : (defaultGuide?.intro.bn || []);

  const related = [row.tool_slug, row.tool_slug_2].filter(Boolean);

  return {
    slug: row.slug,
    metaTitle: row.meta_title || defaultGuide?.metaTitle || row.title_en,
    metaDescription: row.meta_description || defaultGuide?.metaDescription || row.description_en,
    title: {
      en: row.title_en || defaultGuide?.title.en || '',
      bn: row.title_bn || defaultGuide?.title.bn || '',
    },
    excerpt: {
      en: row.description_en || defaultGuide?.excerpt.en || '',
      bn: row.description_bn || defaultGuide?.excerpt.bn || '',
    },
    intro: {
      en: hero_en_paras.length > 0 ? hero_en_paras : (defaultGuide?.intro.en || []),
      bn: hero_bn_paras.length > 0 ? hero_bn_paras : (defaultGuide?.intro.bn || []),
    },
    sections: combinedSections.length > 0 ? combinedSections : (defaultGuide?.sections || []),
    faq: combinedFaq.length > 0 ? combinedFaq : (defaultGuide?.faq || []),
    relatedTools: related.length > 0 ? related : (defaultGuide?.relatedTools || []),
    datePublished: row.date_published || defaultGuide?.datePublished || '2026-10-23',
  };
}

async function fetchRawGuides(): Promise<Guide[]> {
  try {
    const sql = getDb();
    const queryPromise = sql`
      SELECT * FROM content_guides
      WHERE enabled = true
      ORDER BY sort_order ASC, slug ASC;
    `;
    const timeoutPromise = new Promise<any[]>((_, reject) =>
      setTimeout(() => reject(new Error('Guides Query Timeout')), 3500)
    );

    const rows = await Promise.race([queryPromise, timeoutPromise]);
    if (Array.isArray(rows) && rows.length > 0) {
      const guides = rows.map(rowToGuide);
      cachedGuides = guides;
      return guides;
    }
    return cachedGuides || GUIDES;
  } catch (error) {
    console.warn('[getAllGuides] Fallback to code defaults:', error);
    return cachedGuides || GUIDES;
  }
}

// Next.js Data Cache with tag 'guides' and 1 hour TTL backstop
const getCachedAllGuides = unstable_cache(
  fetchRawGuides,
  ['guides-all-cache'],
  { tags: ['guides'], revalidate: 3600 }
);

// React cache() wrapper for per-request de-duplication
export const getAllGuides = cache(async (): Promise<Guide[]> => {
  try {
    return await getCachedAllGuides();
  } catch (err) {
    return cachedGuides || GUIDES;
  }
});

export const getGuideBySlug = cache(async (slug: string): Promise<Guide | null> => {
  const defaultGuide = GUIDES_BY_SLUG[slug] || null;
  try {
    const all = await getAllGuides();
    const found = all.find((g) => g.slug === slug);
    if (found) return found;
  } catch (err) {
    console.warn(`[getGuideBySlug] Fallback for "${slug}":`, err);
  }
  return defaultGuide;
});

export function clearGuidesCache(): void {
  cachedGuides = null;
}
