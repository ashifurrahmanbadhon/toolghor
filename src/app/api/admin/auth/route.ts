import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { verifyPassword, hashPassword, needsRehash } from '@/lib/password';
import {
  requestPasswordReset,
  resendPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
} from '@/lib/passwordReset';

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    // Direct fast query to admin_account with lazy fallback only if table missing
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
      await sql`
        INSERT INTO admin_account (id, username, passcode, email, phone)
        VALUES (1, 'admin', 'admin123', 'ashifur.badhon@gmail.com', '+8801521417284')
        ON CONFLICT (id) DO NOTHING;
      `;
      const fresh = await sql`SELECT * FROM admin_account WHERE id = 1 LIMIT 1`;
      account = fresh[0];
    }

    // 1. LOGIN (Timing-safe verification + Ultra-fast response)
    if (action === 'login') {
      const cleanPass = (body.passcode || '').trim();
      const isValid = await verifyPassword(cleanPass, account.passcode);

      if (isValid) {
        // Upgrade legacy plaintext passwords in background without delaying user login response
        if (needsRehash(account.passcode)) {
          hashPassword(cleanPass).then((upgradedHash) => {
            sql`
              UPDATE admin_account
              SET passcode = ${upgradedHash}, updated_at = CURRENT_TIMESTAMP
              WHERE id = ${account.id};
            `.catch(() => {});
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Authenticated successfully',
          admin: {
            username: account.username,
            email: account.email,
            phone: account.phone,
          },
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Incorrect admin passcode. Please try again.' },
          { status: 401 }
        );
      }
    }

    // 2. GET PROFILE
    if (action === 'get_profile') {
      return NextResponse.json({
        success: true,
        profile: {
          username: account.username,
          email: account.email,
          phone: account.phone,
          updated_at: account.updated_at,
        },
      });
    }

    // 3. UPDATE PROFILE & CHANGE PASSWORD (Always hashes new password)
    if (action === 'update_profile') {
      const { email, phone, current_passcode, new_passcode } = body;

      const cleanCurrent = (current_passcode || '').trim();
      const isCurrentValid = await verifyPassword(cleanCurrent, account.passcode);

      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, message: 'Current password does not match.' },
          { status: 400 }
        );
      }

      let updatedPass = account.passcode;
      if (new_passcode && new_passcode.trim()) {
        if (new_passcode.trim().length < 8) {
          return NextResponse.json(
            { success: false, message: 'New password must be at least 8 characters.' },
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
        profile: {
          username: account.username,
          email: updatedEmail,
          phone: updatedPhone,
        },
      });
    }

    // 4. FORGOT PASSWORD - DISPATCH CODE TO REGISTERED EMAIL ONLY
    if (action === 'forgot_password_send_otp') {
      // Require email input from the user or default to account email
      const targetEmail = (body.email || account.email || '').trim();

      const result = await requestPasswordReset(targetEmail, ip);

      // Mask email for display in UI: e.g. as***@gmail.com
      const maskedEmail = targetEmail.replace(/^(.{2})(.*)(@.*)$/, '$1***$3');

      return NextResponse.json(
        {
          success: result.success,
          message: result.message,
          challengeId: result.challengeId,
          resendCooldownSeconds: result.resendCooldownSeconds,
          targetMasked: maskedEmail,
        },
        { status: result.statusCode || (result.success ? 200 : 400) }
      );
    }

    // 5. RESEND OTP
    if (action === 'resend_otp') {
      const challengeId = body.challengeId || '';
      const result = await resendPasswordResetOtp(challengeId, ip);

      return NextResponse.json(
        {
          success: result.success,
          message: result.message,
          resendCooldownSeconds: result.resendCooldownSeconds,
        },
        { status: result.statusCode || (result.success ? 200 : 400) }
      );
    }

    // 6. FORGOT PASSWORD - VERIFY 6-DIGIT EMAIL CODE (Issues resetToken)
    if (action === 'verify_otp') {
      const challengeId = body.challengeId || '';
      const otp = body.otp || '';

      const result = await verifyPasswordResetOtp(challengeId, otp);

      return NextResponse.json(
        {
          success: result.success,
          message: result.message,
          resetToken: result.resetToken,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: result.statusCode || (result.success ? 200 : 400) }
      );
    }

    // 7. FORGOT PASSWORD - COMPLETE PASSWORD RESET (Gated by resetToken)
    if (action === 'reset_password_verify_otp') {
      const challengeId = body.challengeId || '';
      const resetToken = body.resetToken || '';
      const newPasscode = body.new_passcode || body.newPassword || '';
      const confirmPasscode = body.confirm_passcode || body.confirmPassword || '';

      const result = await completePasswordReset(challengeId, resetToken, newPasscode, confirmPasscode);

      return NextResponse.json(
        {
          success: result.success,
          message: result.message,
        },
        { status: result.statusCode || (result.success ? 200 : 400) }
      );
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Error in /api/admin/auth]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
