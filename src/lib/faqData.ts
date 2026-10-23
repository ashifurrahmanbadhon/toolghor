import { getDb } from '@/lib/db';
import { GENERAL_FAQ, FAQ_DATA, FaqItem } from '@/data/seoData';

let cachedFaqMap: Record<string, FaqItem[]> | null = null;

function buildDefaultMap(): Record<string, FaqItem[]> {
  return {
    general: GENERAL_FAQ,
    ...FAQ_DATA,
  };
}

/** Returns true if a DB row has non-empty, non-whitespace content for both language questions. */
function isValidRow(r: any): boolean {
  return (
    typeof r.question_en === 'string' && r.question_en.trim() !== '' &&
    typeof r.question_bn === 'string' && r.question_bn.trim() !== ''
  );
}

/** Returns the code-default fallback for a given scope. */
function fallbackForScope(scope: string): FaqItem[] {
  if (scope === 'general') return GENERAL_FAQ;
  return FAQ_DATA[scope] || [];
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
      const rawMap: Record<string, any[]> = {};
      for (const r of rows) {
        if (!rawMap[r.scope]) rawMap[r.scope] = [];
        rawMap[r.scope].push(r);
      }

      const map: Record<string, FaqItem[]> = {};
      for (const [scope, scopeRows] of Object.entries(rawMap)) {
        const validItems = scopeRows
          .filter(isValidRow)
          .map((r) => ({
            en: { q: r.question_en, a: r.answer_en },
            bn: { q: r.question_bn, a: r.answer_bn },
          }));
        // Per-scope fallback: if all rows were blank, serve code defaults
        map[scope] = validItems.length > 0 ? validItems : fallbackForScope(scope);
      }

      // Also ensure every known default scope is represented even if absent from DB
      for (const scope of ['general', ...Object.keys(FAQ_DATA)]) {
        if (!map[scope]) {
          map[scope] = fallbackForScope(scope);
        }
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
  const fallback = fallbackForScope(scope);
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
      const validItems = rows
        .filter(isValidRow)
        .map((r: any) => ({
          en: { q: r.question_en, a: r.answer_en },
          bn: { q: r.question_bn, a: r.answer_bn },
        }));
      // If all rows were blank, fall back to code defaults for this scope
      return validItems.length > 0 ? validItems : fallback;
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
