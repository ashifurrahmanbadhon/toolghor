import crypto from 'crypto';

/**
 * Standard parameters for Node.js crypto.scrypt
 * N = 16384 (CPU/memory cost parameter)
 * r = 8 (block size parameter)
 * p = 1 (parallelization parameter)
 * keylen = 64 bytes
 */
const SCRYPT_PREFIX = 's2';
const KEY_LEN = 64;
const SCRYPT_OPTIONS: crypto.ScryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
};

/**
 * Hash a password using Node.js crypto.scrypt with a cryptographically secure 16-byte salt.
 * Format: s2$<salt_hex>$<derived_key_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEY_LEN, SCRYPT_OPTIONS, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${SCRYPT_PREFIX}$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies a candidate password against a stored password.
 * Supports both modern scrypt hashes (s2$...) and legacy plaintext for seamless backward compatibility.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!password || !stored) return false;

  // Check if stored password is an s2 scrypt hash
  if (stored.startsWith(`${SCRYPT_PREFIX}$`)) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const [, salt, hashHex] = parts;

    return new Promise((resolve) => {
      crypto.scrypt(password, salt, KEY_LEN, SCRYPT_OPTIONS, (err, derivedKey) => {
        if (err) return resolve(false);
        try {
          const hashBuf = Buffer.from(hashHex, 'hex');
          if (hashBuf.length !== derivedKey.length) return resolve(false);
          resolve(crypto.timingSafeEqual(hashBuf, derivedKey));
        } catch {
          resolve(false);
        }
      });
    });
  }

  // Fallback for legacy unhashed passwords: compare using timing-safe comparison
  const passBuf = Buffer.from(password, 'utf8');
  const storedBuf = Buffer.from(stored, 'utf8');
  if (passBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(passBuf, storedBuf);
}

/**
 * Checks whether the stored password needs to be upgraded/re-hashed to modern scrypt.
 */
export function needsRehash(stored: string): boolean {
  return !stored || !stored.startsWith(`${SCRYPT_PREFIX}$`);
}
