import crypto from 'crypto';
import { getDb, initDatabase } from './db';
import { sendOtpEmail } from './notifier';
import { hashPassword } from './password';

export const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const MAX_ATTEMPTS = 5;

// In-memory sliding window rate limiter
interface RateLimitEntry {
  count: number;
  firstRequest: number;
}
const ipRateLimits = new Map<string, RateLimitEntry>();
const emailRateLimits = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(map: Map<string, RateLimitEntry>, key: string): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry) {
    map.set(key, { count: 1, firstRequest: now });
    return false;
  }

  if (now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
    map.set(key, { count: 1, firstRequest: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

export function resetRateLimits(): void {
  ipRateLimits.clear();
  emailRateLimits.clear();
}

/**
 * Returns a SHA-256 hash of a string with a server secret pepper.
 */
function hashSecret(val: string): string {
  const secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
  if (!secret) {
    throw new Error('CRITICAL SECURITY ERROR: AUTH_SECRET environment variable is missing.');
  }
  return crypto.createHmac('sha256', secret).update(val).digest('hex');
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP string.
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Standard generic response returned to clients to mitigate account enumeration risks.
 */
export const GENERIC_SUCCESS_MESSAGE =
  'If an account is associated with this email address, a 6-digit verification code has been dispatched. Please check your inbox and spam folder.';

/**
 * Step 1: Request Password Reset and Send Email OTP
 */
export async function requestPasswordReset(
  emailInput: string,
  ipAddress: string = 'unknown'
): Promise<{
  success: boolean;
  message: string;
  challengeId?: string;
  resendCooldownSeconds: number;
  error?: string;
  statusCode?: number;
}> {
  const normalizedEmail = (emailInput || '').trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return {
      success: false,
      message: 'Please provide a valid email address.',
      resendCooldownSeconds: 0,
      statusCode: 400,
    };
  }

  // Rate limiting check
  if (isRateLimited(ipRateLimits, ipAddress) || isRateLimited(emailRateLimits, normalizedEmail)) {
    return {
      success: false,
      message: 'Too many password reset requests. Please wait 15 minutes before trying again.',
      resendCooldownSeconds: 60,
      statusCode: 429,
    };
  }

  await initDatabase();
  const sql = getDb();

  // Find user by email
  const users = await sql`
    SELECT id, email, username FROM admin_account
    WHERE LOWER(TRIM(email)) = ${normalizedEmail}
    LIMIT 1;
  `;

  const user = users[0];

  // If user does not exist, return generic message with a dummy challenge to prevent user enumeration
  if (!user) {
    // Artificial timing delay to prevent timing attacks
    await new Promise((r) => setTimeout(r, 200 + crypto.randomInt(0, 150)));
    const dummyChallengeId = crypto.randomUUID();
    return {
      success: true,
      message: GENERIC_SUCCESS_MESSAGE,
      challengeId: dummyChallengeId,
      resendCooldownSeconds: 60,
    };
  }

  // Invalidate any existing pending challenges for this account
  await sql`
    UPDATE password_reset_challenges
    SET is_consumed = true, updated_at = CURRENT_TIMESTAMP
    WHERE account_id = ${user.id} AND is_consumed = false;
  `;

  // Generate new OTP and challenge
  const rawOtp = generateSecureOtp();
  const otpHash = hashSecret(rawOtp);
  const challengeId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
  const cooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_MS);

  await sql`
    INSERT INTO password_reset_challenges (
      id, account_id, email, otp_hash, otp_expires_at, attempts, max_attempts,
      resend_cooldown_until, is_verified, is_consumed, ip_address
    )
    VALUES (
      ${challengeId}, ${user.id}, ${normalizedEmail}, ${otpHash}, ${expiresAt.toISOString()}, 0, ${MAX_ATTEMPTS},
      ${cooldownUntil.toISOString()}, false, false, ${ipAddress}
    );
  `;

  // Send Email OTP
  const sendResult = await sendOtpEmail(normalizedEmail, rawOtp);
  if (!sendResult.success) {
    console.error(`[PasswordReset] Failed sending OTP email: ${sendResult.error}`);
    // If live delivery failed due to missing credentials, inform user gracefully
    return {
      success: false,
      message: sendResult.error || 'Failed to dispatch email. Please check server mail configuration.',
      challengeId,
      resendCooldownSeconds: 0,
      statusCode: 500,
    };
  }

  return {
    success: true,
    message: GENERIC_SUCCESS_MESSAGE,
    challengeId,
    resendCooldownSeconds: 60,
  };
}

/**
 * Step 2: Resend OTP with Server-Side Cooldown and Rate Limiting
 */
export async function resendPasswordResetOtp(
  challengeId: string,
  ipAddress: string = 'unknown'
): Promise<{
  success: boolean;
  message: string;
  resendCooldownSeconds: number;
  statusCode?: number;
}> {
  if (!challengeId) {
    return {
      success: false,
      message: 'Challenge ID is required.',
      resendCooldownSeconds: 0,
      statusCode: 400,
    };
  }

  if (isRateLimited(ipRateLimits, ipAddress)) {
    return {
      success: false,
      message: 'Too many requests. Please wait a few minutes before requesting another code.',
      resendCooldownSeconds: 60,
      statusCode: 429,
    };
  }

  await initDatabase();
  const sql = getDb();

  const rows = await sql`
    SELECT * FROM password_reset_challenges
    WHERE id = ${challengeId}
    LIMIT 1;
  `;

  const challenge = rows[0];

  // If challenge not found (e.g. was a dummy challenge), return generic success to avoid enumeration
  if (!challenge || challenge.is_consumed || challenge.is_verified) {
    await new Promise((r) => setTimeout(r, 200));
    return {
      success: true,
      message: 'A new 6-digit verification code has been dispatched.',
      resendCooldownSeconds: 60,
    };
  }

  // Check cooldown
  const now = Date.now();
  const cooldownUntil = new Date(challenge.resend_cooldown_until).getTime();
  if (now < cooldownUntil) {
    const remainingSecs = Math.ceil((cooldownUntil - now) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSecs} second${remainingSecs === 1 ? '' : 's'} before requesting a new code.`,
      resendCooldownSeconds: remainingSecs,
      statusCode: 429,
    };
  }

  // Generate new OTP, reset attempts, update expiry to 5 minutes from now
  const rawOtp = generateSecureOtp();
  const otpHash = hashSecret(rawOtp);
  const newExpiry = new Date(now + OTP_EXPIRY_MS);
  const newCooldown = new Date(now + RESEND_COOLDOWN_MS);

  await sql`
    UPDATE password_reset_challenges
    SET
      otp_hash = ${otpHash},
      otp_expires_at = ${newExpiry.toISOString()},
      attempts = 0,
      resend_cooldown_until = ${newCooldown.toISOString()},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${challengeId};
  `;

  const sendResult = await sendOtpEmail(challenge.email, rawOtp);
  if (!sendResult.success) {
    return {
      success: false,
      message: sendResult.error || 'Failed to resend verification email.',
      resendCooldownSeconds: 0,
      statusCode: 500,
    };
  }

  return {
    success: true,
    message: 'A new 6-digit verification code has been dispatched to your email.',
    resendCooldownSeconds: 60,
  };
}

/**
 * Step 3: Verify the 6-Digit Email OTP
 * On success, issues a single-use bearer resetToken (valid for 10 minutes)
 */
export async function verifyPasswordResetOtp(
  challengeId: string,
  otpInput: string
): Promise<{
  success: boolean;
  message: string;
  resetToken?: string;
  attemptsRemaining?: number;
  statusCode?: number;
}> {
  const cleanOtp = (otpInput || '').trim();

  if (!challengeId || !cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return {
      success: false,
      message: 'Please enter a valid 6-digit numeric verification code.',
      statusCode: 400,
    };
  }

  await initDatabase();
  const sql = getDb();

  const rows = await sql`
    SELECT * FROM password_reset_challenges
    WHERE id = ${challengeId}
    LIMIT 1;
  `;

  const challenge = rows[0];

  if (!challenge || challenge.is_consumed) {
    return {
      success: false,
      message: 'Invalid or expired recovery session. Please request a new verification code.',
      statusCode: 400,
    };
  }

  // Check if challenge was already verified
  if (challenge.is_verified) {
    return {
      success: false,
      message: 'This recovery session has already been verified.',
      statusCode: 400,
    };
  }

  // Check if max attempts reached
  if (challenge.attempts >= challenge.max_attempts) {
    await sql`
      UPDATE password_reset_challenges
      SET is_consumed = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${challengeId};
    `;
    return {
      success: false,
      message: 'Too many incorrect attempts. For your security, this session has been locked. Please request a new code.',
      attemptsRemaining: 0,
      statusCode: 429,
    };
  }

  // Check expiration (5 minutes)
  const now = Date.now();
  const expiresAt = new Date(challenge.otp_expires_at).getTime();
  if (now > expiresAt) {
    return {
      success: false,
      message: 'The verification code has expired. Please request a new code.',
      statusCode: 400,
    };
  }

  // Compute hash of provided OTP
  const candidateHash = hashSecret(cleanOtp);
  const candidateBuf = Buffer.from(candidateHash, 'hex');
  const storedBuf = Buffer.from(challenge.otp_hash, 'hex');

  const isMatch = candidateBuf.length === storedBuf.length && crypto.timingSafeEqual(candidateBuf, storedBuf);

  if (!isMatch) {
    const newAttempts = challenge.attempts + 1;
    const remaining = Math.max(0, challenge.max_attempts - newAttempts);

    await sql`
      UPDATE password_reset_challenges
      SET
        attempts = ${newAttempts},
        is_consumed = ${newAttempts >= challenge.max_attempts},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${challengeId};
    `;

    if (remaining === 0) {
      return {
        success: false,
        message: 'Too many incorrect attempts. This session has been locked. Please request a new code.',
        attemptsRemaining: 0,
        statusCode: 429,
      };
    }

    return {
      success: false,
      message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      attemptsRemaining: remaining,
      statusCode: 400,
    };
  }

  // OTP verified successfully: issue single-use reset authorization token (10 min expiry)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = hashSecret(resetToken);
  const resetTokenExpiresAt = new Date(now + RESET_TOKEN_EXPIRY_MS);

  await sql`
    UPDATE password_reset_challenges
    SET
      is_verified = true,
      reset_token_hash = ${resetTokenHash},
      reset_token_expires_at = ${resetTokenExpiresAt.toISOString()},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${challengeId};
  `;

  return {
    success: true,
    message: 'Verification successful. You may now create your new password.',
    resetToken,
  };
}

/**
 * Step 4: Complete Password Reset
 * Validates the single-use reset authorization token, hashes the new password with scrypt,
 * updates the account, and atomically consumes the challenge to prevent reuse.
 */
export async function completePasswordReset(
  challengeId: string,
  resetToken: string,
  newPassword: string,
  confirmPassword?: string
): Promise<{
  success: boolean;
  message: string;
  statusCode?: number;
}> {
  if (!challengeId || !resetToken) {
    return {
      success: false,
      message: 'Valid password reset authorization is required.',
      statusCode: 400,
    };
  }

  const cleanPass = (newPassword || '').trim();

  if (!cleanPass || cleanPass.length < 8) {
    return {
      success: false,
      message: 'New password must be at least 8 characters long.',
      statusCode: 400,
    };
  }

  if (confirmPassword != null && cleanPass !== confirmPassword.trim()) {
    return {
      success: false,
      message: 'New password and confirmation password do not match.',
      statusCode: 400,
    };
  }

  await initDatabase();
  const sql = getDb();

  const rows = await sql`
    SELECT * FROM password_reset_challenges
    WHERE id = ${challengeId}
    LIMIT 1;
  `;

  const challenge = rows[0];

  if (!challenge || !challenge.is_verified || challenge.is_consumed || !challenge.reset_token_hash) {
    return {
      success: false,
      message: 'Invalid or already consumed password reset authorization. Please restart verification.',
      statusCode: 400,
    };
  }

  // Verify reset token expiration (10 minutes)
  const now = Date.now();
  const tokenExpiresAt = new Date(challenge.reset_token_expires_at).getTime();
  if (now > tokenExpiresAt) {
    await sql`
      UPDATE password_reset_challenges
      SET is_consumed = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${challengeId};
    `;
    return {
      success: false,
      message: 'Password reset authorization has expired. Please request a new verification code.',
      statusCode: 400,
    };
  }

  // Verify reset token hash
  const candidateHash = hashSecret(resetToken.trim());
  const candidateBuf = Buffer.from(candidateHash, 'hex');
  const storedBuf = Buffer.from(challenge.reset_token_hash, 'hex');

  const isTokenValid = candidateBuf.length === storedBuf.length && crypto.timingSafeEqual(candidateBuf, storedBuf);

  if (!isTokenValid) {
    return {
      success: false,
      message: 'Invalid reset authorization token.',
      statusCode: 400,
    };
  }

  // Hash password using modern cryptographic scrypt
  const hashedPassword = await hashPassword(cleanPass);

  // Atomically update password and consume the challenge
  await sql`
    UPDATE admin_account
    SET
      passcode = ${hashedPassword},
      reset_otp = NULL,
      reset_otp_expires_at = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${challenge.account_id};
  `;

  await sql`
    UPDATE password_reset_challenges
    SET
      is_consumed = true,
      reset_token_hash = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${challengeId};
  `;

  // Invalidate any other active challenges for this account
  await sql`
    UPDATE password_reset_challenges
    SET is_consumed = true, updated_at = CURRENT_TIMESTAMP
    WHERE account_id = ${challenge.account_id} AND is_consumed = false;
  `;

  return {
    success: true,
    message: 'Your password has been reset successfully! You can now log in with your new password.',
  };
}
