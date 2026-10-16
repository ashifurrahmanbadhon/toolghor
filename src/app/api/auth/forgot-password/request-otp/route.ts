import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/passwordReset';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').trim();
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address is required to request a verification code.' },
        { status: 400 }
      );
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    const result = await requestPasswordReset(email, ip);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        challengeId: result.challengeId,
        resendCooldownSeconds: result.resendCooldownSeconds,
      },
      { status: result.statusCode || (result.success ? 200 : 400) }
    );
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password/request-otp error]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing reset request.' },
      { status: 500 }
    );
  }
}
