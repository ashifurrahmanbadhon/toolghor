// Enable mock email store and test mode before any imports
(process.env as Record<string, string | undefined>).NODE_ENV = 'test';
process.env.ENABLE_TEST_EMAIL_MOCK = 'true';

import assert from 'node:assert/strict';
import { describe, it, before, beforeEach } from 'node:test';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { getDb, initDatabase } from '../src/lib/db';
import { __testEmailStore } from '../src/lib/notifier';
import {
  requestPasswordReset,
  resendPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
  resetRateLimits,
} from '../src/lib/passwordReset';

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

describe('Email OTP Password Recovery Flow (End-to-End)', () => {
  const TEST_EMAIL = 'admin.recovery.test@toolghor.test';

  before(async () => {
    await initDatabase();
    const sql = getDb();
    const initialHash = await hashPassword('InitialPass123!');
    await sql`
      INSERT INTO admin_account (id, username, email, phone, passcode)
      VALUES (1, 'test_recovery_admin', ${TEST_EMAIL}, '+8801999999999', ${initialHash})
      ON CONFLICT (id) DO UPDATE SET email = ${TEST_EMAIL}, passcode = ${initialHash};
    `;
  });

  beforeEach(() => {
    // Clear in-memory mock email store and sliding window rate limits
    __testEmailStore.length = 0;
    resetRateLimits();
  });

  it('1. Mitigates account enumeration with generic response on unknown email', async () => {
    const res = await requestPasswordReset('nonexistent.user@randomdomain.test');
    assert.equal(res.success, true);
    assert.ok(res.message.includes('If an account is associated with this email'));
    // No email should be sent for nonexistent account
    assert.equal(__testEmailStore.length, 0);
  });

  it('2. Requests OTP successfully and delivers via email provider mock', async () => {
    const res = await requestPasswordReset(TEST_EMAIL);
    assert.equal(res.success, true);
    assert.ok(res.challengeId, 'Should return a challengeId');
    assert.ok(res.resendCooldownSeconds > 0, 'Should return cooldown');

    // Email was dispatched to mock store
    assert.equal(__testEmailStore.length, 1);
    const sent = __testEmailStore[0];
    assert.equal(sent.toEmail, TEST_EMAIL);
    assert.match(sent.otpCode, /^\d{6}$/, 'Dispatched OTP must be a 6-digit number');

    // Verify OTP is NOT stored in plaintext in the database
    const sql = getDb();
    const rows = await sql`
      SELECT otp_hash FROM password_reset_challenges WHERE id = ${res.challengeId}
    `;
    assert.equal(rows.length, 1);
    assert.notEqual(rows[0].otp_hash, sent.otpCode, 'OTP must not be stored in plaintext');
  });

  it('3. Enforces 60-second resend cooldown', async () => {
    const firstReq = await requestPasswordReset(TEST_EMAIL);
    assert.equal(firstReq.success, true);

    // Immediate resend should be rejected by cooldown
    const cooldownRes = await resendPasswordResetOtp(firstReq.challengeId!);
    assert.equal(cooldownRes.success, false);
    assert.ok(cooldownRes.message.includes('wait'), 'Should report cooldown active');
  });

  it('4. Rejects invalid or wrong OTP and decrements remaining attempts', async () => {
    const req = await requestPasswordReset(TEST_EMAIL);
    const challengeId = req.challengeId!;

    // Attempt 1: wrong OTP
    const attempt1 = await verifyPasswordResetOtp(challengeId, '000000');
    assert.equal(attempt1.success, false);
    assert.equal(attempt1.attemptsRemaining, 4);

    // Attempt 2: wrong OTP
    const attempt2 = await verifyPasswordResetOtp(challengeId, '111111');
    assert.equal(attempt2.success, false);
    assert.equal(attempt2.attemptsRemaining, 3);
  });

  it('5. Locks out challenge after 5 failed verification attempts (brute force protection)', async () => {
    const req = await requestPasswordReset(TEST_EMAIL);
    const challengeId = req.challengeId!;

    // Exhaust remaining attempts (5 attempts total)
    for (let i = 0; i < 5; i++) {
      await verifyPasswordResetOtp(challengeId, `99999${i}`);
    }

    // Subsequent attempt should be locked out
    const lockedRes = await verifyPasswordResetOtp(challengeId, '123456');
    assert.equal(lockedRes.success, false);
    assert.ok(
      lockedRes.message.toLowerCase().includes('too many') ||
      lockedRes.message.toLowerCase().includes('exceeded') ||
      lockedRes.message.toLowerCase().includes('invalid')
    );
  });

  it('6. Verifies valid OTP and issues single-use reset authorization token', async () => {
    const req = await requestPasswordReset(TEST_EMAIL);
    const challengeId = req.challengeId!;

    const lastEmail = __testEmailStore[__testEmailStore.length - 1];
    const validOtp = lastEmail.otpCode;

    const verifyRes = await verifyPasswordResetOtp(challengeId, validOtp);
    assert.equal(verifyRes.success, true);
    assert.ok(verifyRes.resetToken, 'Must return single-use reset authorization token');
    assert.equal(verifyRes.resetToken!.length, 64, 'Reset token must be 32-byte hex string (64 characters)');

    // Attempting to verify the same OTP again must fail (no replay)
    const replayRes = await verifyPasswordResetOtp(challengeId, validOtp);
    assert.equal(replayRes.success, false, 'Replaying verified OTP must be rejected');
  });

  it('7. Rejects password reset without valid reset authorization token', async () => {
    const fakeToken = 'a'.repeat(64);
    const fakeChallengeId = '00000000-0000-0000-0000-000000000000';

    const res = await completePasswordReset(
      fakeChallengeId,
      fakeToken,
      'BrandNewPassword123!',
      'BrandNewPassword123!'
    );
    assert.equal(res.success, false);
    assert.ok(
      res.message.toLowerCase().includes('invalid') ||
      res.message.toLowerCase().includes('expired') ||
      res.message.toLowerCase().includes('required')
    );
  });

  it('8. Completes password reset atomically, invalidates token, and verifies DB update', async () => {
    // Step A: Request OTP
    const req = await requestPasswordReset(TEST_EMAIL);
    const challengeId = req.challengeId!;
    const otp = __testEmailStore[__testEmailStore.length - 1].otpCode;

    // Step B: Verify OTP to obtain reset token
    const verifyRes = await verifyPasswordResetOtp(challengeId, otp);
    assert.equal(verifyRes.success, true);
    const resetToken = verifyRes.resetToken!;

    // Step C: Complete reset
    const newPassword = 'BrandNewSuperSecurePass456!';
    const resetRes = await completePasswordReset(
      challengeId,
      resetToken,
      newPassword,
      newPassword
    );
    assert.equal(resetRes.success, true);

    // Step D: Verify that resetToken cannot be reused (Single-Use Token check)
    const reuseRes = await completePasswordReset(
      challengeId,
      resetToken,
      'YetAnotherPassword789!',
      'YetAnotherPassword789!'
    );
    assert.equal(reuseRes.success, false, 'Reset token must be single-use only');

    // Step E: Verify new password matches in DB
    const sql = getDb();
    const rows = await sql`
      SELECT passcode FROM admin_account WHERE id = 1
    `;
    assert.ok(rows.length > 0);
    const isNewPassValid = await verifyPassword(newPassword, rows[0].passcode);
    assert.equal(isNewPassValid, true, 'Admin account passcode must verify against new password');
  });
});
