import { NextRequest, NextResponse } from 'next/server';
import { verifyPasswordResetOtp } from '@/lib/passwordReset';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
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
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password/verify-otp error]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error verifying code.' },
      { status: 500 }
    );
  }
}
