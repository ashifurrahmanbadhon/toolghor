import { getDb } from '@/lib/db';
import { GENERAL_FAQ, FAQ_DATA, FaqItem } from '@/data/seoData';

let cachedFaqMap: Record<string, FaqItem[]> | null = null;

function buildDefaultMap(): Record<string, FaqItem[]> {
  return {
    general: GENERAL_FAQ,
    ...FAQ_DATA,
  };
}

export async function getAllFaqScopes(): Promise<Record<string, FaqItem[]>> {
  try {
    const sql = getDb();
    const queryPromise = sql`
      SELECT scope, sort_order, enabled, question_en, question_bn, answer_en, answer_bn
      FROM content_faq_items
      WHERE enabled = true
      ORDER BY scope ASC, sort_order ASC, id ASC;
    `;
    const timeoutPromise = new Promise<any[]>((_, reject) =>
      setTimeout(() => reject(new Error('FAQ Query Timeout')), 3500)
    );

    const rows = await Promise.race([queryPromise, timeoutPromise]);
    if (Array.isArray(rows) && rows.length > 0) {
      const map: Record<string, FaqItem[]> = {};
      for (const r of rows) {
        if (!map[r.scope]) map[r.scope] = [];
        map[r.scope].push({
          en: { q: r.question_en, a: r.answer_en },
          bn: { q: r.question_bn, a: r.answer_bn },
        });
      }
      cachedFaqMap = map;
      return map;
    }
    return cachedFaqMap || buildDefaultMap();
  } catch (error) {
    console.warn('[getAllFaqScopes] Fallback to code defaults:', error);
    return cachedFaqMap || buildDefaultMap();
  }
}

export async function getFaqByScope(scope: string): Promise<FaqItem[]> {
  const fallback = scope === 'general' ? GENERAL_FAQ : (FAQ_DATA[scope] || []);
  try {
    const sql = getDb();
    const queryPromise = sql`
      SELECT sort_order, enabled, question_en, question_bn, answer_en, answer_bn
      FROM content_faq_items
      WHERE scope = ${scope} AND enabled = true
      ORDER BY sort_order ASC, id ASC;
    `;
    const timeoutPromise = new Promise<any[]>((_, reject) =>
      setTimeout(() => reject(new Error('Scope FAQ Timeout')), 3500)
    );

    const rows = await Promise.race([queryPromise, timeoutPromise]);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => ({
        en: { q: r.question_en, a: r.answer_en },
        bn: { q: r.question_bn, a: r.answer_bn },
      }));
    }
  } catch (error) {
    console.warn(`[getFaqByScope] Fallback for scope "${scope}":`, error);
  }
  return fallback;
}

export async function getGeneralFaq(): Promise<FaqItem[]> {
  return getFaqByScope('general');
}

export function clearFaqCache(): void {
  cachedFaqMap = null;
}
