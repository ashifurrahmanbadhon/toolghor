import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getDb, initDatabase } from '@/lib/db';
import { verifyPassword, hashPassword, needsRehash } from '@/lib/password';
import {
  createAdminSessionToken,
  verifyAdminRequest,
  setAdminSessionCookie,
  clearAdminSessionCookie,
} from '@/lib/adminAuth';
import {
  verifyTOTP,
  verifyTOTPWithStep,
  generateBase32Secret,
  checkPasswordDoorLockout,
  checkAuthenticatorDoorLockout,
} from '@/lib/totp';
import { runConfigCheck } from '@/lib/configCheck';
import {
  isLoginRateLimited,
  recordFailedLoginAttempt,
  clearLoginRateLimit,
} from '@/lib/security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    let account: any = null;
    try {
      const rows = await sql`SELECT id, username, email, phone, totp_enabled, password_locked_until, totp_locked_until FROM admin_account WHERE id = 1 LIMIT 1`;
      account = rows[0];
    } catch {
      await initDatabase();
      const rows = await sql`SELECT id, username, email, phone, totp_enabled, password_locked_until, totp_locked_until FROM admin_account WHERE id = 1 LIMIT 1`;
      account = rows[0];
    }

    const session = verifyAdminRequest(req);
    const pwdLock = checkPasswordDoorLockout(account);
    const totpLock = checkAuthenticatorDoorLockout(account);

    return NextResponse.json({
      success: true,
      authenticated: Boolean(session),
      user: session ? { username: account?.username, email: account?.email } : null,
      totp_enabled: Boolean(account?.totp_enabled),
      password_locked: pwdLock.isLocked,
      password_lock_minutes: pwdLock.remainingMinutes,
      totp_locked: totpLock.isLocked,
      totp_lock_minutes: totpLock.remainingMinutes,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  runConfigCheck();
  try {
    const sql = getDb();
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Direct query to admin_account with fallback to initDatabase
    let account: any = null;
    try {
      const rows = await sql`SELECT * FROM admin_account WHERE id = 1 LIMIT 1`;
      account = rows[0];
    } catch {
      await initDatabase();
      const rows = await sql`SELECT * FROM admin_account WHERE id = 1 LIMIT 1`;
      account = rows[0];
    }

    if (!account) {
      const initialPass = (process.env.ADMIN_SETUP_PASSCODE || process.env.ADMIN_INITIAL_PASSWORD || '').trim();
      if (initialPass) {
        const initialHash = await hashPassword(initialPass);
        await sql`
          INSERT INTO admin_account (id, username, passcode, email, phone)
          VALUES (1, 'admin', ${initialHash}, 'ashifur.badhon@gmail.com', '+8801521417284')
          ON CONFLICT (id) DO NOTHING;
        `;
        const fresh = await sql`SELECT * FROM admin_account WHERE id = 1 LIMIT 1`;
        account = fresh[0];
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'Admin account is not initialized. Please configure ADMIN_SETUP_PASSCODE environment variable.',
          },
          { status: 503 }
        );
      }
    }

    // Invalidate previously issued backup hashes if present (fully removed from platform)
    if (account?.totp_recovery_hashes && account.totp_recovery_hashes !== '[]') {
      try {
        await sql`
          UPDATE admin_account
          SET totp_recovery_hashes = '[]', updated_at = CURRENT_TIMESTAMP
          WHERE id = ${account.id} AND totp_recovery_hashes != '[]';
        `;
        account.totp_recovery_hashes = '[]';
      } catch {}
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';

    const tooManyAttemptsResponse = (retryAfterSeconds: number) =>
      NextResponse.json(
        {
          success: false,
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
          message_bn: 'অনেকবার ভুল লগইন চেষ্টা করা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.max(1, retryAfterSeconds)) },
        }
      );

    // =========================================================================
    // DOOR 1: PASSWORD LOGIN (Lockout: 3 consecutive failed attempts -> 15 min)
    // =========================================================================
    if (action === 'login') {
      const pwdRateKey = `admin_login_pwd_${ip}`;
      const ipLimitCheck = await isLoginRateLimited(pwdRateKey, 5);
      if (ipLimitCheck.limited) {
        return tooManyAttemptsResponse(ipLimitCheck.retryAfterSeconds);
      }

      // 1. Check password lockout
      const lockout = checkPasswordDoorLockout(account);
      if (lockout.isLocked) {
        const ipLimit = await recordFailedLoginAttempt(pwdRateKey, 5, 900);
        if (ipLimit.limited) {
          return tooManyAttemptsResponse(ipLimit.retryAfterSeconds);
        }
        return NextResponse.json(
          {
            success: false,
            isLocked: true,
            remainingMinutes: lockout.remainingMinutes,
            message: lockout.message,
            message_bn: lockout.message_bn,
          },
          { status: 403 }
        );
      }

      const cleanPass = (body.passcode || body.password || '').trim();
      if (!cleanPass) {
        return NextResponse.json(
          { success: false, message: 'Password is required.', message_bn: 'পাসওয়ার্ড প্রদান করুন।' },
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(cleanPass, account.passcode);

      if (isValid) {
        // Reset password failed attempts, IP counter & unlock
        await Promise.all([
          sql`
            UPDATE admin_account
            SET
              password_failed_attempts = 0,
              password_locked_until = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${account.id};
          `,
          clearLoginRateLimit(pwdRateKey),
        ]);

        // Upgrade legacy plaintext passwords in background if necessary
        if (needsRehash(account.passcode)) {
          hashPassword(cleanPass).then((upgradedHash) => {
            sql`
              UPDATE admin_account
              SET passcode = ${upgradedHash}, updated_at = CURRENT_TIMESTAMP
              WHERE id = ${account.id};
            `.catch(() => {});
          });
        }

        const remember = body.remember !== false;
        const sessionToken = createAdminSessionToken(
          { id: account.id, username: account.username },
          remember
        );

        const res = NextResponse.json({
          success: true,
          message: 'Authenticated successfully',
          login_method: 'password',
          admin: {
            username: account.username,
            email: account.email,
            phone: account.phone,
            totp_enabled: Boolean(account.totp_enabled),
          },
        });

        setAdminSessionCookie(res, sessionToken, remember);
        return res;
      } else {
        // Increment failed attempts and lock for 15 minutes if >= 3
        const currentAttempts = (account.password_failed_attempts || 0) + 1;
        const maxAttempts = 3;
        const isNewlyLocked = currentAttempts >= maxAttempts;
        let lockedUntil: Date | null = null;
        if (isNewlyLocked) {
          lockedUntil = new Date(Date.now() + 15 * 60000);
        }

        await sql`
          UPDATE admin_account
          SET
            password_failed_attempts = ${currentAttempts},
            password_locked_until = ${lockedUntil ? lockedUntil.toISOString() : null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${account.id};
        `;

        const ipLimit = await recordFailedLoginAttempt(pwdRateKey, 5, 900);
        if (ipLimit.limited) {
          return tooManyAttemptsResponse(ipLimit.retryAfterSeconds);
        }

        const remaining = Math.max(0, maxAttempts - currentAttempts);
        const errorMsg = isNewlyLocked
          ? 'Password login is locked for ~15 min — use Authenticator.'
          : `Incorrect admin passcode. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining before password lockout)`;
        const errorMsgBn = isNewlyLocked
          ? 'পাসওয়ার্ড লগইন সাময়িকভাবে লক করা হয়েছে (~১৫ মিনিট) — দয়া করে অথেন্টিকেটর দিয়ে লগইন করুন।'
          : `ভুল পাসওয়ার্ড। (আর ${remaining} বার চেষ্টার সুযোগ আছে)`;

        return NextResponse.json(
          {
            success: false,
            isLocked: isNewlyLocked,
            remainingAttempts: remaining,
            message: errorMsg,
            message_bn: errorMsgBn,
          },
          { status: isNewlyLocked ? 403 : 401 }
        );
      }
    }

    // =========================================================================
    // DOOR 2: AUTHENTICATOR LOGIN (RFC 6238 TOTP, Password Door Stays Open)
    // =========================================================================
    if (action === 'login_totp') {
      const totpRateKey = `admin_login_totp_${ip}`;
      const ipLimitCheck = await isLoginRateLimited(totpRateKey, 5);
      if (ipLimitCheck.limited) {
        return tooManyAttemptsResponse(ipLimitCheck.retryAfterSeconds);
      }

      // 1. Check if 2FA is enrolled
      if (!account.totp_enabled || !account.totp_secret) {
        return NextResponse.json(
          {
            success: false,
            notSetup: true,
            message: 'Two-factor authentication is not set up yet. Please log in using your Password.',
            message_bn: 'টু-ফ্যাক্টর অথেন্টিকেশন এখনও সেটআপ করা হয়নি। দয়া করে পাসওয়ার্ড দিয়ে লগইন করুন।',
          },
          { status: 400 }
        );
      }

      // 2. Check authenticator door lockout (Password door stays open)
      const lockout = checkAuthenticatorDoorLockout(account);
      if (lockout.isLocked) {
        const ipLimit = await recordFailedLoginAttempt(totpRateKey, 5, 900);
        if (ipLimit.limited) {
          return tooManyAttemptsResponse(ipLimit.retryAfterSeconds);
        }
        return NextResponse.json(
          {
            success: false,
            isLocked: true,
            remainingMinutes: lockout.remainingMinutes,
            message: lockout.message,
            message_bn: lockout.message_bn,
          },
          { status: 403 }
        );
      }

      const rawCode = (body.code || body.totp_code || '').trim();
      if (!rawCode) {
        return NextResponse.json(
          {
            success: false,
            message: 'Verification code is required.',
            message_bn: 'ভেরিফিকেশন কোড প্রদান করুন।',
          },
          { status: 400 }
        );
      }

      let isValid = false;
      let matchedStep: number | null = null;

      // 1) Try TOTP with Anti-Replay check
      const totpResult = verifyTOTPWithStep(
        rawCode,
        account.totp_secret,
        1,
        account.last_totp_step || 0
      );

      if (totpResult.valid) {
        isValid = true;
        matchedStep = totpResult.step ?? null;
      } else if (totpResult.reason === 'replay') {
        // Replayed token
        const currentAttempts = (account.totp_failed_attempts || 0) + 1;
        const maxAttempts = 3;
        const isNewlyLocked = currentAttempts >= maxAttempts;
        let lockedUntil: Date | null = null;
        if (isNewlyLocked) {
          lockedUntil = new Date(Date.now() + 15 * 60000);
        }

        await sql`
          UPDATE admin_account
          SET
            totp_failed_attempts = ${currentAttempts},
            totp_locked_until = ${lockedUntil ? lockedUntil.toISOString() : null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${account.id};
        `;

        const ipLimit = await recordFailedLoginAttempt(totpRateKey, 5, 900);
        if (ipLimit.limited) {
          return tooManyAttemptsResponse(ipLimit.retryAfterSeconds);
        }

        const remaining = Math.max(0, maxAttempts - currentAttempts);
        return NextResponse.json(
          {
            success: false,
            isLocked: isNewlyLocked,
            remainingAttempts: remaining,
            message: isNewlyLocked
              ? 'Authenticator login is locked for ~15 min — use Password.'
              : `Code has already been used. Please wait for the next 30-second token. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout)`,
            message_bn: isNewlyLocked
              ? 'অথেন্টিকেটর লগইন সাময়িকভাবে লক করা হয়েছে (~১৫ মিনিট) — দয়া করে পাসওয়ার্ড দিয়ে লগইন করুন।'
              : `কোডটি ইতোমধ্যে ব্যবহৃত হয়েছে। পরবর্তী ৩০ সেকেন্ডের টোকেন দিন। (আর ${remaining} বার চেষ্টার সুযোগ আছে)`,
          },
          { status: isNewlyLocked ? 403 : 401 }
        );
      }

      if (!isValid) {
        const currentAttempts = (account.totp_failed_attempts || 0) + 1;
        const maxAttempts = 3;
        const isNewlyLocked = currentAttempts >= maxAttempts;
        let lockedUntil: Date | null = null;
        if (isNewlyLocked) {
          lockedUntil = new Date(Date.now() + 15 * 60000);
        }

        await sql`
          UPDATE admin_account
          SET
            totp_failed_attempts = ${currentAttempts},
            totp_locked_until = ${lockedUntil ? lockedUntil.toISOString() : null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${account.id};
        `;

        const ipLimit = await recordFailedLoginAttempt(totpRateKey, 5, 900);
        if (ipLimit.limited) {
          return tooManyAttemptsResponse(ipLimit.retryAfterSeconds);
        }

        const remaining = Math.max(0, maxAttempts - currentAttempts);
        const errorMsg = isNewlyLocked
          ? 'Authenticator login is locked for ~15 min — use Password.'
          : `Invalid verification code. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining before authenticator lockout)`;
        const errorMsgBn = isNewlyLocked
          ? 'অথেন্টিকেটর লগইন সাময়িকভাবে লক করা হয়েছে (~১৫ মিনিট) — দয়া করে পাসওয়ার্ড দিয়ে লগইন করুন।'
          : `ভুল অথেন্টিকেটর কোড। (আর ${remaining} বার চেষ্টার সুযোগ আছে)`;

        return NextResponse.json(
          {
            success: false,
            isLocked: isNewlyLocked,
            remainingAttempts: remaining,
            message: errorMsg,
            message_bn: errorMsgBn,
          },
          { status: isNewlyLocked ? 403 : 401 }
        );
      }

      // Successful Authenticator Login
      await Promise.all([
        sql`
          UPDATE admin_account
          SET
            totp_failed_attempts = 0,
            totp_locked_until = NULL,
            last_totp_step = ${matchedStep},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${account.id};
        `,
        clearLoginRateLimit(totpRateKey),
      ]);

      const remember = body.remember !== false;
      const sessionToken = createAdminSessionToken(
        { id: account.id, username: account.username },
        remember
      );

      const res = NextResponse.json({
        success: true,
        message: 'Authenticated successfully via Authenticator',
        login_method: 'authenticator',
        admin: {
          username: account.username,
          email: account.email,
          phone: account.phone,
          totp_enabled: Boolean(account.totp_enabled),
        },
      });

      setAdminSessionCookie(res, sessionToken, remember);
      return res;
    }

    // LOGOUT
    if (action === 'logout') {
      const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
      clearAdminSessionCookie(res);
      return res;
    }

    // =========================================================================
    // PROFILE MANAGEMENT (Requires verified admin session)
    // =========================================================================
    if (action === 'get_profile') {
      const session = verifyAdminRequest(req);
      if (!session) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized. Admin session required.',
            message_bn: 'অননুমোদিত। অ্যাডমিন সেশন প্রয়োজন।',
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        profile: {
          username: account.username,
          email: account.email,
          phone: account.phone,
          updated_at: account.updated_at,
          totp_enabled: Boolean(account.totp_enabled),
        },
      });
    }

    if (action === 'update_profile') {
      const session = verifyAdminRequest(req);
      if (!session) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized. Admin session required.',
            message_bn: 'অননুমোদিত। অ্যাডমিন সেশন প্রয়োজন।',
          },
          { status: 401 }
        );
      }

      const { email, phone, current_passcode, new_passcode } = body;

      const cleanCurrent = (current_passcode || '').trim();
      const isCurrentValid = await verifyPassword(cleanCurrent, account.passcode);

      if (!isCurrentValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password does not match.',
            message_bn: 'বর্তমান পাসওয়ার্ড সঠিক নয়।',
          },
          { status: 400 }
        );
      }

      let updatedPass = account.passcode;
      if (new_passcode && new_passcode.trim()) {
        if (new_passcode.trim().length < 8) {
          return NextResponse.json(
            {
              success: false,
              message: 'New password must be at least 8 characters.',
              message_bn: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।',
            },
            { status: 400 }
          );
        }
        updatedPass = await hashPassword(new_passcode.trim());
      }

      const updatedEmail = email && email.trim() ? email.trim() : account.email;
      const updatedPhone = phone && phone.trim() ? phone.trim() : account.phone;

      await sql`
        UPDATE admin_account
        SET
          passcode = ${updatedPass},
          email = ${updatedEmail},
          phone = ${updatedPhone},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `;

      return NextResponse.json({
        success: true,
        message: 'Profile and password updated successfully in database.',
        message_bn: 'প্রোফাইল ও পাসওয়ার্ড সফলভাবে ডাটাবেজে আপডেট হয়েছে।',
        profile: {
          username: account.username,
          email: updatedEmail,
          phone: updatedPhone,
          totp_enabled: Boolean(account.totp_enabled),
        },
      });
    }

    // =========================================================================
    // 2FA ENROLMENT & MANAGEMENT (Gated by admin session)
    // =========================================================================

    // Status
    if (action === '2fa_status') {
      const session = verifyAdminRequest(req);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        enabled: Boolean(account.totp_enabled),
      });
    }

    // Setup: generate secret and QR code data URL (requires current password)
    if (action === '2fa_setup') {
      const session = verifyAdminRequest(req);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const currentPass = (body.current_password || body.password || body.passcode || '').trim();
      if (!currentPass) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password is required to initiate 2FA setup.',
            message_bn: 'টু-ফ্যাক্টর সেটআপ শুরু করতে বর্তমান পাসওয়ার্ড প্রদান করুন।',
          },
          { status: 400 }
        );
      }

      const isPassValid = await verifyPassword(currentPass, account.passcode);
      if (!isPassValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password does not match.',
            message_bn: 'বর্তমান পাসওয়ার্ড সঠিক নয়।',
          },
          { status: 401 }
        );
      }

      const secret = generateBase32Secret(20);
      const issuer = 'ToolGhor';
      const userLabel = account.email || account.username || 'admin@toolghor.com';
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userLabel)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

      const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
        margin: 2,
        width: 250,
        color: { dark: '#000000', light: '#ffffff' },
      });

      return NextResponse.json({
        success: true,
        secret,
        manual_key: secret,
        qr_code: qrDataUrl,
        otpauth_url: otpauthUrl,
      });
    }

    // Enable: verifies live code against setup_token, stores secret
    if (action === '2fa_enable') {
      const session = verifyAdminRequest(req);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { setup_token, code } = body;
      const currentPass = (body.current_password || body.password || body.passcode || '').trim();

      if (!currentPass) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password is required to enable 2FA.',
            message_bn: 'টু-ফ্যাক্টর সক্রিয় করতে বর্তমান পাসওয়ার্ড প্রদান করুন।',
          },
          { status: 400 }
        );
      }

      const isPassValid = await verifyPassword(currentPass, account.passcode);
      if (!isPassValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password does not match.',
            message_bn: 'বর্তমান পাসওয়ার্ড সঠিক নয়।',
          },
          { status: 401 }
        );
      }

      if (!setup_token || !code) {
        return NextResponse.json(
          {
            success: false,
            message: 'Setup secret and verification code are required.',
            message_bn: 'সেটআপ সিক্রেট এবং ভেরিফিকেশন কোড প্রদান করুন।',
          },
          { status: 400 }
        );
      }

      const isCodeValid = verifyTOTP(code, setup_token);
      if (!isCodeValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid verification code. Please check your authenticator app and system clock.',
            message_bn: 'ভুল ভেরিফিকেশন কোড। দয়া করে আপনার অথেন্টিকেটর অ্যাপ চেক করুন।',
          },
          { status: 400 }
        );
      }

      await sql`
        UPDATE admin_account
        SET
          totp_secret = ${setup_token},
          totp_enabled = true,
          totp_recovery_hashes = '[]',
          totp_failed_attempts = 0,
          totp_locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${account.id};
      `;

      return NextResponse.json({
        success: true,
        message: 'Two-Factor Authentication enabled successfully!',
        message_bn: 'টু-ফ্যাক্টর অথেন্টিকেশন সফলভাবে সক্রিয় হয়েছে!',
      });
    }

    // Disable: requires password AND valid TOTP
    if (action === '2fa_disable') {
      const session = verifyAdminRequest(req);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const currentPass = (body.current_password || body.password || body.passcode || '').trim();
      const code = (body.code || body.totp_code || '').trim();

      if (!currentPass || !code) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password and verification code are required to disable 2FA.',
            message_bn: 'টু-ফ্যাক্টর নিষ্ক্রিয় করতে বর্তমান পাসওয়ার্ড এবং কোড প্রদান করুন।',
          },
          { status: 400 }
        );
      }

      const isPassValid = await verifyPassword(currentPass, account.passcode);
      if (!isPassValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password does not match.',
            message_bn: 'বর্তমান পাসওয়ার্ড সঠিক নয়।',
          },
          { status: 401 }
        );
      }

      const isCodeValid = Boolean(account.totp_secret && verifyTOTP(code, account.totp_secret));

      if (!isCodeValid) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid verification code.',
            message_bn: 'ভুল ভেরিফিকেশন কোড।',
          },
          { status: 400 }
        );
      }

      await sql`
        UPDATE admin_account
        SET
          totp_secret = '',
          totp_enabled = false,
          totp_recovery_hashes = '[]',
          totp_failed_attempts = 0,
          totp_locked_until = NULL,
          last_totp_step = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${account.id};
      `;

      return NextResponse.json({
        success: true,
        message: 'Two-Factor Authentication disabled successfully',
        message_bn: 'টু-ফ্যাক্টর অথেন্টিকেশন সফলভাবে নিষ্ক্রিয় করা হয়েছে।',
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Error in /api/admin/auth]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
