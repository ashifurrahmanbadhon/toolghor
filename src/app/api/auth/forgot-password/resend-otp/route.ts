import { NextRequest, NextResponse } from 'next/server';
import { resendPasswordResetOtp } from '@/lib/passwordReset';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const challengeId = body.challengeId || '';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    const result = await resendPasswordResetOtp(challengeId, ip);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        resendCooldownSeconds: result.resendCooldownSeconds,
      },
      { status: result.statusCode || (result.success ? 200 : 400) }
    );
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password/resend-otp error]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error resending code.' },
      { status: 500 }
    );
  }
}
