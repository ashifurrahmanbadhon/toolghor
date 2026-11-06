import crypto from 'crypto';

// RFC 3548 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 secret string (20 bytes = 160 bits entropy)
 */
export function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

/**
 * Decodes a Base32 string to a Buffer
 */
export function base32ToBuffer(base32Str: string): Buffer {
  const clean = (base32Str || '').toUpperCase().replace(/[\s=-]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generates an RFC 6238 TOTP 6-digit code for a given timestamp
 */
export function generateTOTP(secret: string, timestamp = Date.now()): string {
  const epoch = Math.floor(timestamp / 1000);
  const timeStep = Math.floor(epoch / 30);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(timeStep));

  const key = base32ToBuffer(secret);
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code with tolerance window (default ±1 window = ±30 seconds)
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const now = Date.now();
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const checkTime = now + errorWindow * 30 * 1000;
    if (generateTOTP(secret, checkTime) === cleanToken) {
      return true;
    }
  }
  return false;
}

/**
 * Verifies TOTP with anti-replay tracking (checks step > lastAcceptedStep)
 */
export function verifyTOTPWithStep(
  token: string,
  secret: string,
  window = 1,
  lastAcceptedStep: number | string = 0
): { valid: boolean; reason?: 'invalid' | 'replay'; step?: number } {
  if (!token || !secret) return { valid: false, reason: 'invalid' };
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return { valid: false, reason: 'invalid' };
  }

  const now = Date.now();
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const checkTime = now + errorWindow * 30 * 1000;
    if (generateTOTP(secret, checkTime) === cleanToken) {
      const step = Math.floor(Math.floor(checkTime / 1000) / 30);
      if (lastAcceptedStep && step <= Number(lastAcceptedStep)) {
        return { valid: false, reason: 'replay', step };
      }
      return { valid: true, step };
    }
  }
  return { valid: false, reason: 'invalid' };
}

/**
 * Generates high-entropy emergency backup recovery codes (10 codes)
 * Formatted as XXXXX-XXXXX (e.g. 8A3F2-9BC41)
 */
export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    const part1 = raw.slice(0, 5);
    const raw2 = crypto.randomBytes(5).toString('hex').toUpperCase();
    const part2 = raw2.slice(0, 5);
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * PBKDF2 salted hash for recovery code storage
 */
export function hashRecoveryCode(code: string, salt: string | null = null): string {
  const clean = (code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(clean, s, 50000, 32, 'sha256').toString('hex');
  return `${s}:${hash}`;
}

/**
 * Constant-time verification of recovery code against salted PBKDF2 hash
 * with legacy SHA-256 fallback
 */
export function verifyRecoveryCode(code: string, stored: string): boolean {
  if (!code || !stored) return false;
  const clean = (code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (!clean) return false;

  try {
    if (stored.includes(':')) {
      const [s, expectedHash] = stored.split(':');
      const actualHash = crypto.pbkdf2Sync(clean, s, 50000, 32, 'sha256').toString('hex');
      const expBuf = Buffer.from(expectedHash, 'hex');
      const actBuf = Buffer.from(actualHash, 'hex');
      if (expBuf.length !== actBuf.length) return false;
      return crypto.timingSafeEqual(expBuf, actBuf);
    }

    // Legacy un-salted sha256 fallback
    const legacyHash = crypto.createHash('sha256').update(clean).digest('hex');
    const expBuf = Buffer.from(stored, 'hex');
    const actBuf = Buffer.from(legacyHash, 'hex');
    if (expBuf.length !== actBuf.length) return false;
    return crypto.timingSafeEqual(expBuf, actBuf);
  } catch {
    return false;
  }
}

/**
 * Check Password door lockout status (3 failed attempts -> 15 min lock)
 */
export function checkPasswordDoorLockout(admin: any): {
  isLocked: boolean;
  remainingMinutes: number;
  message: string;
  message_bn: string;
} {
  if (!admin) return { isLocked: false, remainingMinutes: 0, message: '', message_bn: '' };

  if (admin.password_locked_until) {
    const lockTime = new Date(admin.password_locked_until).getTime();
    const now = Date.now();
    if (lockTime > now) {
      const remainingMinutes = Math.max(1, Math.ceil((lockTime - now) / 60000));
      return {
        isLocked: true,
        remainingMinutes,
        message: `Password login is locked for ~${remainingMinutes} min — use Authenticator.`,
        message_bn: `পাসওয়ার্ড লগইন সাময়িকভাবে লক করা হয়েছে (~${remainingMinutes} মিনিট) — দয়া করে অথেন্টিকেটর ব্যবহার করুন।`,
      };
    }
  }

  return { isLocked: false, remainingMinutes: 0, message: '', message_bn: '' };
}

/**
 * Check Authenticator door lockout status (3 failed attempts -> 15 min lock)
 */
export function checkAuthenticatorDoorLockout(admin: any): {
  isLocked: boolean;
  remainingMinutes: number;
  message: string;
  message_bn: string;
} {
  if (!admin) return { isLocked: false, remainingMinutes: 0, message: '', message_bn: '' };

  if (admin.totp_locked_until) {
    const lockTime = new Date(admin.totp_locked_until).getTime();
    const now = Date.now();
    if (lockTime > now) {
      const remainingMinutes = Math.max(1, Math.ceil((lockTime - now) / 60000));
      return {
        isLocked: true,
        remainingMinutes,
        message: `Authenticator login is locked for ~${remainingMinutes} min — use Password.`,
        message_bn: `অথেন্টিকেটর লগইন সাময়িকভাবে লক করা হয়েছে (~${remainingMinutes} মিনিট) — দয়া করে পাসওয়ার্ড ব্যবহার করুন।`,
      };
    }
  }

  return { isLocked: false, remainingMinutes: 0, message: '', message_bn: '' };
}

