import { getDb } from './db';

export interface ILovePdfCredential {
  public: string;
  secret: string;
}

export function isRotationStatus(status: number): boolean {
  return status === 401 || status === 402 || status === 403 || status === 429;
}

export function logKeyRotation(service: string, failedIndex: number, status: number): void {
  console.warn(`[apiKeys] ${service} key index ${failedIndex} failed with ${status}, rotating to index ${failedIndex + 1}`);
}

function cleanKey(k: any): string {
  if (typeof k !== 'string') return '';
  const trimmed = k.trim();
  if (
    !trimmed ||
    trimmed === 'your_key_here' ||
    trimmed === 'your_gemini_key_here' ||
    trimmed === 'your_openai_key_here' ||
    trimmed === 'your_convertapi_token_here' ||
    trimmed === 'your_token_here' ||
    trimmed === '277226@Asif' ||
    trimmed.startsWith('••') ||
    trimmed.includes('••••')
  ) {
    return '';
  }
  return trimmed;
}

function parseJsonArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export async function getGeminiKeys(): Promise<string[]> {
  const envKey = cleanKey(process.env.GEMINI_API_KEY);
  const keys: string[] = [];
  if (envKey) keys.push(envKey);

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT is_active, gemini_active, gemini_key, gemini_keys
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && row.is_active && row.gemini_active) {
      const list = parseJsonArray<string>(row.gemini_keys)
        .map(cleanKey)
        .filter(Boolean);
      if (list.length > 0) {
        keys.push(...list);
      } else {
        const single = cleanKey(row.gemini_key);
        if (single) keys.push(single);
      }
    }
  } catch (err: any) {
    console.warn('[apiKeys] Failed to fetch Gemini keys from DB:', err?.message || err);
  }

  return Array.from(new Set(keys));
}

export async function getOpenAiKeys(): Promise<string[]> {
  const envKey = cleanKey(process.env.OPENAI_API_KEY);
  const keys: string[] = [];
  if (envKey) keys.push(envKey);

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT is_active, openai_active, openai_key, openai_keys
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && row.is_active && row.openai_active) {
      const list = parseJsonArray<string>(row.openai_keys)
        .map(cleanKey)
        .filter(Boolean);
      if (list.length > 0) {
        keys.push(...list);
      } else {
        const single = cleanKey(row.openai_key);
        if (single) keys.push(single);
      }
    }
  } catch (err: any) {
    console.warn('[apiKeys] Failed to fetch OpenAI keys from DB:', err?.message || err);
  }

  return Array.from(new Set(keys));
}

export async function getConvertApiKeys(): Promise<string[]> {
  const envToken = cleanKey(process.env.CONVERTAPI_TOKEN || process.env.CONVERTAPI_SECRET);
  const keys: string[] = [];
  if (envToken) keys.push(envToken);

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT is_active, convertapi_active, convertapi_token, convertapi_keys
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && row.is_active && row.convertapi_active) {
      const list = parseJsonArray<string>(row.convertapi_keys)
        .map(cleanKey)
        .filter(Boolean);
      if (list.length > 0) {
        keys.push(...list);
      } else {
        const single = cleanKey(row.convertapi_token);
        if (single) keys.push(single);
      }
    }
  } catch (err: any) {
    console.warn('[apiKeys] Failed to fetch ConvertAPI keys from DB:', err?.message || err);
  }

  return Array.from(new Set(keys));
}

export async function getRemoveBgKeys(): Promise<string[]> {
  const envKey = cleanKey(process.env.REMOVE_BG_API_KEY || process.env.REMOVEBG_API_KEY);
  const keys: string[] = [];
  if (envKey) keys.push(envKey);

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT is_active, removebg_active, removebg_key, removebg_keys
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && row.is_active && row.removebg_active) {
      const list = parseJsonArray<string>(row.removebg_keys)
        .map(cleanKey)
        .filter(Boolean);
      if (list.length > 0) {
        keys.push(...list);
      } else {
        const single = cleanKey(row.removebg_key);
        if (single) keys.push(single);
      }
    }
  } catch (err: any) {
    console.warn('[apiKeys] Failed to fetch remove.bg keys from DB:', err?.message || err);
  }

  return Array.from(new Set(keys));
}

export async function getILovePdfKeys(): Promise<ILovePdfCredential[]> {
  const envPub = cleanKey(process.env.ILOVEPDF_PUBLIC_KEY);
  const envSec = cleanKey(process.env.ILOVEPDF_SECRET_KEY);
  const creds: ILovePdfCredential[] = [];

  if (envPub || envSec) {
    creds.push({ public: envPub, secret: envSec });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT is_active, ilovepdf_active, ilovepdf_public_key, ilovepdf_secret_key, ilovepdf_keys
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && row.is_active && row.ilovepdf_active) {
      const rawList = parseJsonArray<any>(row.ilovepdf_keys);
      const list: ILovePdfCredential[] = [];
      for (const item of rawList) {
        const pub = cleanKey(item?.public || item?.publicKey);
        const sec = cleanKey(item?.secret || item?.secretKey);
        if (pub || sec) {
          list.push({ public: pub, secret: sec });
        }
      }

      if (list.length > 0) {
        creds.push(...list);
      } else {
        const singlePub = cleanKey(row.ilovepdf_public_key);
        const singleSec = cleanKey(row.ilovepdf_secret_key);
        if (singlePub || singleSec) {
          creds.push({ public: singlePub, secret: singleSec });
        }
      }
    }
  } catch (err: any) {
    console.warn('[apiKeys] Failed to fetch iLovePDF keys from DB:', err?.message || err);
  }

  // Deduplicate by stringified representation
  const seen = new Set<string>();
  const unique: ILovePdfCredential[] = [];
  for (const c of creds) {
    const key = `${c.public}::${c.secret}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }

  return unique;
}
