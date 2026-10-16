/**
 * Server-side Startup & Environment Configuration Health Check
 * Validates presence of critical production environment variables
 * WITHOUT logging secret values (only logs PRESENT / MISSING).
 */

export interface ConfigStatus {
  AUTH_SECRET: 'PRESENT' | 'MISSING';
  DATABASE_URL: 'PRESENT' | 'MISSING';
  REMOVE_BG_API_KEY: 'PRESENT' | 'MISSING';
  CONVERTAPI_TOKEN: 'PRESENT' | 'MISSING';
  RESEND_API_KEY_OR_SMTP: 'PRESENT' | 'MISSING';
}

function isValPresent(val?: string): boolean {
  if (!val) return false;
  const clean = val.trim();
  return Boolean(
    clean &&
    clean !== 'your_key_here' &&
    clean !== 'your_token_here' &&
    clean !== 'your_convertapi_token_here' &&
    clean !== 'your_auth_secret_here'
  );
}

export function getConfigStatus(): ConfigStatus {
  return {
    AUTH_SECRET: isValPresent(process.env.AUTH_SECRET) ? 'PRESENT' : 'MISSING',
    DATABASE_URL: isValPresent(process.env.DATABASE_URL || process.env.POSTGRES_URL) ? 'PRESENT' : 'MISSING',
    REMOVE_BG_API_KEY: isValPresent(process.env.REMOVE_BG_API_KEY || process.env.REMOVEBG_API_KEY) ? 'PRESENT' : 'MISSING',
    CONVERTAPI_TOKEN: isValPresent(process.env.CONVERTAPI_TOKEN) ? 'PRESENT' : 'MISSING',
    RESEND_API_KEY_OR_SMTP: isValPresent(process.env.RESEND_API_KEY || process.env.SMTP_USER || process.env.GMAIL_USER) ? 'PRESENT' : 'MISSING',
  };
}

let hasRunStartupCheck = false;

export function runConfigCheck(force = false): ConfigStatus {
  if (hasRunStartupCheck && !force) {
    return getConfigStatus();
  }
  hasRunStartupCheck = true;

  const status = getConfigStatus();
  console.log('--- [TOOLGHOR SERVER STARTUP CONFIG CHECK] ---');
  for (const [key, val] of Object.entries(status)) {
    console.log(`[CONFIG] ${key}: ${val}`);
  }
  console.log('----------------------------------------------');

  return status;
}
