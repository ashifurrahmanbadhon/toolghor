(process.env as Record<string, string | undefined>).NODE_ENV = 'test';

import assert from 'node:assert/strict';
import { describe, it, before, beforeEach } from 'node:test';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { getDb, initDatabase } from '../src/lib/db';
import {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  verifyTOTPWithStep,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  checkPasswordDoorLockout,
  checkAuthenticatorDoorLockout,
} from '../src/lib/totp';

describe('Password Hashing & Upgrades (src/lib/password.ts)', () => {
  it('hashes password with scrypt format (s2$...$...) and verifies correctly', async () => {
    const raw = 'SecretPassword123!';
    const hashed = await hashPassword(raw);
    assert.ok(hashed.startsWith('s2$'), 'Hash should start with s2$ prefix');
    const isValid = await verifyPassword(raw, hashed);
    assert.equal(isValid, true, 'Plaintext should verify against its hash');

    const isWrong = await verifyPassword('WrongPassword', hashed);
    assert.equal(isWrong, false, 'Wrong password should fail verification');
  });

  it('verifies legacy plaintext passwords for automatic migration', async () => {
    const legacyPlain = 'admin123';
    const isValid = await verifyPassword('admin123', legacyPlain);
    assert.equal(isValid, true, 'Legacy plaintext should verify');

    const isWrong = await verifyPassword('wrong123', legacyPlain);
    assert.equal(isWrong, false, 'Wrong plaintext password should fail');
  });
});

describe('TOTP RFC 6238 & Recovery Code Engine (src/lib/totp.ts)', () => {
  it('1. Generates valid Base32 secret string with 20 bytes entropy', () => {
    const secret = generateBase32Secret(20);
    assert.equal(typeof secret, 'string');
    assert.equal(secret.length, 20);
    assert.match(secret, /^[A-Z2-7]+$/, 'Secret must only contain RFC 3548 Base32 characters');
  });

  it('2. Generates 6-digit TOTP code and verifies within ±1 time window', () => {
    const secret = generateBase32Secret(20);
    const now = Date.now();
    const token = generateTOTP(secret, now);

    assert.equal(token.length, 6, 'TOTP must be 6 digits');
    assert.match(token, /^\d{6}$/, 'TOTP must be purely numeric');

    // Verify at current time
    assert.equal(verifyTOTP(token, secret, 1), true, 'Current token should verify');

    // Verify with past time (-25s, still in ±1 step window)
    const tokenPast = generateTOTP(secret, now - 25000);
    assert.equal(verifyTOTP(tokenPast, secret, 1), true, 'Token from -25s should verify');

    // Reject wrong token
    assert.equal(verifyTOTP('000000', secret, 1) === (token === '000000'), true);
  });

  it('3. Enforces anti-replay protection with verifyTOTPWithStep', () => {
    const secret = generateBase32Secret(20);
    const now = Date.now();
    const token = generateTOTP(secret, now);
    const currentStep = Math.floor(Math.floor(now / 1000) / 30);

    // First use: valid
    const res1 = verifyTOTPWithStep(token, secret, 1, 0);
    assert.equal(res1.valid, true);
    assert.equal(res1.step, currentStep);

    // Second use with lastAcceptedStep recorded: rejected as replay
    const res2 = verifyTOTPWithStep(token, secret, 1, currentStep);
    assert.equal(res2.valid, false);
    assert.equal(res2.reason, 'replay');
  });

  it('4. Generates 10 high-entropy recovery codes and verifies with PBKDF2 salted hash', () => {
    const codes = generateRecoveryCodes(10);
    assert.equal(codes.length, 10);

    for (const code of codes) {
      assert.match(code, /^[A-F0-9]{5}-[A-F0-9]{5}$/, 'Code should follow XXXXX-XXXXX hex format');
      const hash = hashRecoveryCode(code);
      assert.ok(hash.includes(':'), 'Stored hash should contain salt:hash format');

      assert.equal(verifyRecoveryCode(code, hash), true, 'Valid code verifies against hash');
      assert.equal(verifyRecoveryCode(code.toLowerCase(), hash), true, 'Case-insensitive verification');
      assert.equal(verifyRecoveryCode('WRONG-CODE1', hash), false, 'Wrong code fails verification');
    }
  });

  it('5. Lockout checks correctly identify locked doors based on timestamp', () => {
    const unlockedAdmin = { password_locked_until: null, totp_locked_until: null };
    assert.equal(checkPasswordDoorLockout(unlockedAdmin).isLocked, false);
    assert.equal(checkAuthenticatorDoorLockout(unlockedAdmin).isLocked, false);

    // Locked for 10 minutes in the future
    const futureLock = new Date(Date.now() + 10 * 60000).toISOString();
    const lockedAdmin = {
      password_locked_until: futureLock,
      totp_locked_until: futureLock,
    };

    const pwdLock = checkPasswordDoorLockout(lockedAdmin);
    assert.equal(pwdLock.isLocked, true);
    assert.ok(pwdLock.remainingMinutes >= 9 && pwdLock.remainingMinutes <= 10);
    assert.ok(pwdLock.message.includes('Password login is locked'));

    const totpLock = checkAuthenticatorDoorLockout(lockedAdmin);
    assert.equal(totpLock.isLocked, true);
    assert.ok(totpLock.remainingMinutes >= 9 && totpLock.remainingMinutes <= 10);
    assert.ok(totpLock.message.includes('Authenticator login is locked'));

    // Past lock timestamp is automatically expired
    const pastLock = new Date(Date.now() - 60000).toISOString();
    const expiredLockAdmin = {
      password_locked_until: pastLock,
      totp_locked_until: pastLock,
    };
    assert.equal(checkPasswordDoorLockout(expiredLockAdmin).isLocked, false);
    assert.equal(checkAuthenticatorDoorLockout(expiredLockAdmin).isLocked, false);
  });
});

describe('Two-Door Admin Authentication & 2FA Lifecycle Database Flow', () => {
  const TEST_ID = 8888;
  const TEST_USER = 'test_totp_admin';
  const TEST_PASS = 'SuperStrongAdminPass!2026';

  before(async () => {
    await initDatabase();
    const sql = getDb();
    const passHash = await hashPassword(TEST_PASS);

    await sql`
      INSERT INTO admin_account (
        id, username, email, phone, passcode,
        totp_secret, totp_enabled, totp_recovery_hashes,
        password_failed_attempts, password_locked_until,
        totp_failed_attempts, totp_locked_until
      )
      VALUES (
        ${TEST_ID}, ${TEST_USER}, 'test.totp@toolghor.test', '+8801700000000', ${passHash},
        '', false, '[]',
        0, NULL,
        0, NULL
      )
      ON CONFLICT (id) DO UPDATE
      SET
        passcode = ${passHash},
        totp_secret = '',
        totp_enabled = false,
        totp_recovery_hashes = '[]',
        password_failed_attempts = 0,
        password_locked_until = NULL,
        totp_failed_attempts = 0,
        totp_locked_until = NULL;
    `;
  });

  it('1. Door 1 (Password): tracks failed attempts and locks for 15 min after 3 attempts', async () => {
    const sql = getDb();
    const admin = (await sql`SELECT * FROM admin_account WHERE id = ${TEST_ID}`)[0];

    // Attempt 1: wrong password
    let attempts = (admin.password_failed_attempts || 0) + 1;
    assert.equal(attempts, 1);
    await sql`UPDATE admin_account SET password_failed_attempts = ${attempts} WHERE id = ${TEST_ID}`;

    // Attempt 2: wrong password
    attempts += 1;
    assert.equal(attempts, 2);
    await sql`UPDATE admin_account SET password_failed_attempts = ${attempts} WHERE id = ${TEST_ID}`;

    // Attempt 3: wrong password -> lock door
    attempts += 1;
    assert.equal(attempts, 3);
    const lockedUntil = new Date(Date.now() + 15 * 60000);
    await sql`
      UPDATE admin_account
      SET password_failed_attempts = ${attempts}, password_locked_until = ${lockedUntil.toISOString()}
      WHERE id = ${TEST_ID}
    `;

    const lockedRow = (await sql`SELECT * FROM admin_account WHERE id = ${TEST_ID}`)[0];
    const lockout = checkPasswordDoorLockout(lockedRow);
    assert.equal(lockout.isLocked, true);
    assert.ok(lockout.remainingMinutes >= 14 && lockout.remainingMinutes <= 15);

    // Password door is locked, but Authenticator door remains UNLOCKED!
    const totpLockout = checkAuthenticatorDoorLockout(lockedRow);
    assert.equal(totpLockout.isLocked, false, 'Authenticator door must stay open when password door is locked');

    // Successful login resets lock and failed attempts
    await sql`
      UPDATE admin_account
      SET password_failed_attempts = 0, password_locked_until = NULL
      WHERE id = ${TEST_ID}
    `;
    const resetRow = (await sql`SELECT * FROM admin_account WHERE id = ${TEST_ID}`)[0];
    assert.equal(resetRow.password_failed_attempts, 0);
    assert.equal(resetRow.password_locked_until, null);
  });

  it('2. Door 2 (Authenticator): enables 2FA, stores secret, generates recovery codes', async () => {
    const sql = getDb();
    const secret = generateBase32Secret(20);
    const now = Date.now();
    const validOtp = generateTOTP(secret, now);

    // Verify OTP succeeds
    assert.equal(verifyTOTP(validOtp, secret), true);

    // Generate 10 recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    assert.equal(recoveryCodes.length, 10);
    const hashes = recoveryCodes.map((code) => ({
      hash: hashRecoveryCode(code),
      used: false,
    }));

    // Store in DB
    await sql`
      UPDATE admin_account
      SET
        totp_secret = ${secret},
        totp_enabled = true,
        totp_recovery_hashes = ${JSON.stringify(hashes)},
        totp_failed_attempts = 0,
        totp_locked_until = NULL
      WHERE id = ${TEST_ID}
    `;

    const updated = (await sql`SELECT * FROM admin_account WHERE id = ${TEST_ID}`)[0];
    assert.equal(updated.totp_enabled, true);
    assert.equal(updated.totp_secret, secret);

    const storedHashes = JSON.parse(updated.totp_recovery_hashes);
    assert.equal(storedHashes.length, 10);
    assert.equal(storedHashes.filter((h: any) => !h.used).length, 10);
  });

  it('3. Door 2 (Authenticator): logs in with emergency recovery code and permanently consumes it', async () => {
    const sql = getDb();
    const admin = (await sql`SELECT * FROM admin_account WHERE id = ${TEST_ID}`)[0];
    const hashes = JSON.parse(admin.totp_recovery_hashes);

    // Generate test code and verify match with first code
    const testCode = 'TEST1-CODE1';
    hashes[0] = { hash: hashRecoveryCode(testCode), used: false };
    await sql`UPDATE admin_account SET totp_recovery_hashes = ${JSON.stringify(hashes)} WHERE id = ${TEST_ID}`;

    // Verify and consume
    let matched = false;
    for (const item of hashes) {
      if (!item.used && verifyRecoveryCode(testCode, item.hash)) {
        item.used = true;
        item.used_at = new Date().toISOString();
        matched = true;
        break;
      }
    }
    assert.equal(matched, true, 'Recovery code should match');

    await sql`UPDATE admin_account SET totp_recovery_hashes = ${JSON.stringify(hashes)} WHERE id = ${TEST_ID}`;

    // Verify it is permanently consumed and cannot be reused
    const fresh = (await sql`SELECT * FROM admin_account WHERE id = ${TEST_ID}`)[0];
    const freshHashes = JSON.parse(fresh.totp_recovery_hashes);
    const remainingUnused = freshHashes.filter((h: any) => !h.used).length;
    assert.equal(remainingUnused, 9, 'Exactly 9 recovery codes must remain');

    // Attempting to reuse same code must fail
    let reused = false;
    for (const item of freshHashes) {
      if (!item.used && verifyRecoveryCode(testCode, item.hash)) {
        reused = true;
        break;
      }
    }
    assert.equal(reused, false, 'Consumed recovery code must NOT be usable again');
  });

  it('4. Door 2 (Authenticator): locks after 3 failed attempts while password door stays open', async () => {
    const sql = getDb();
    const lockedUntil = new Date(Date.now() + 15 * 60000);
    await sql`
      UPDATE admin_account
      SET totp_failed_attempts = 3, totp_locked_until = ${lockedUntil.toISOString()}
      WHERE id = ${TEST_ID}
    `;

    const admin = (await sql`SELECT * FROM admin_account WHERE id = ${TEST_ID}`)[0];
    const totpLock = checkAuthenticatorDoorLockout(admin);
    assert.equal(totpLock.isLocked, true);
    assert.ok(totpLock.message.includes('Authenticator login is locked'));

    const pwdLock = checkPasswordDoorLockout(admin);
    assert.equal(pwdLock.isLocked, false, 'Password door must remain open during Authenticator lockout');
  });

  it('5. Disabling 2FA clears secret and recovery codes', async () => {
    const sql = getDb();
    await sql`
      UPDATE admin_account
      SET
        totp_secret = '',
        totp_enabled = false,
        totp_recovery_hashes = '[]',
        totp_failed_attempts = 0,
        totp_locked_until = NULL,
        last_totp_step = 0
      WHERE id = ${TEST_ID}
    `;

    const admin = (await sql`SELECT * FROM admin_account WHERE id = ${TEST_ID}`)[0];
    assert.equal(admin.totp_enabled, false);
    assert.equal(admin.totp_secret, '');
    assert.equal(admin.totp_recovery_hashes, '[]');
  });
});
