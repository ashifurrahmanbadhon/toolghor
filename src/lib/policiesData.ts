import { getDb } from '@/lib/db';
import {
  DEFAULT_POLICY_SECTIONS,
  POLICY_SECTIONS_LIST,
  PolicySection,
} from '@/data/policiesDefaults';

let cachedPolicies: Record<string, PolicySection> | null = null;

export async function getAllPolicySections(): Promise<Record<string, PolicySection>> {
  try {
    const sql = getDb();

    // Query each of the 9 separate tables in parallel with a 3500ms timeout
    const queryPromises = POLICY_SECTIONS_LIST.map(async (sec) => {
      try {
        const rows = await sql.query(
          `SELECT id, title_en, title_bn, body_en, body_bn, updated_at FROM ${sec.table_name} WHERE id = 1 LIMIT 1`
        );
        const row = rows[0];
        const defaultSec = DEFAULT_POLICY_SECTIONS[sec.id];

        if (row && (row.title_en || row.title_bn || row.body_en || row.body_bn)) {
          return {
            id: sec.id,
            table_name: sec.table_name,
            title_en: row.title_en || defaultSec.title_en,
            title_bn: row.title_bn || defaultSec.title_bn,
            body_en: row.body_en || defaultSec.body_en,
            body_bn: row.body_bn || defaultSec.body_bn,
            updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : defaultSec.updated_at,
          };
        }
        return defaultSec;
      } catch (err) {
        console.warn(`[getAllPolicySections] Error fetching ${sec.table_name}, using fallback:`, err);
        return DEFAULT_POLICY_SECTIONS[sec.id];
      }
    });

    const timeoutPromise = new Promise<PolicySection[]>((_, reject) =>
      setTimeout(() => reject(new Error('Policy Query Timeout')), 3500)
    );

    const results = await Promise.race([Promise.all(queryPromises), timeoutPromise]);

    const policyMap: Record<string, PolicySection> = {};
    for (const item of results) {
      policyMap[item.id] = item;
    }

    cachedPolicies = policyMap;
    return policyMap;
  } catch (error) {
    console.warn('[getAllPolicySections] Database query error or timeout, falling back to defaults:', error);
    if (cachedPolicies) return cachedPolicies;
    return DEFAULT_POLICY_SECTIONS;
  }
}

export async function getPolicySection(sectionId: string): Promise<PolicySection> {
  const defaultSec = DEFAULT_POLICY_SECTIONS[sectionId];
  if (!defaultSec) {
    throw new Error(`Unknown policy section id: ${sectionId}`);
  }

  try {
    const sql = getDb();
    const rows = await sql.query(
      `SELECT id, title_en, title_bn, body_en, body_bn, updated_at FROM ${defaultSec.table_name} WHERE id = 1 LIMIT 1`
    );
    const row = rows[0];
    if (row && (row.title_en || row.title_bn || row.body_en || row.body_bn)) {
      return {
        id: defaultSec.id,
        table_name: defaultSec.table_name,
        title_en: row.title_en || defaultSec.title_en,
        title_bn: row.title_bn || defaultSec.title_bn,
        body_en: row.body_en || defaultSec.body_en,
        body_bn: row.body_bn || defaultSec.body_bn,
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : defaultSec.updated_at,
      };
    }
  } catch (err) {
    console.warn(`[getPolicySection] Error fetching ${defaultSec.table_name}, using default:`, err);
  }

  return defaultSec;
}

export function clearPoliciesCache() {
  cachedPolicies = null;
}
