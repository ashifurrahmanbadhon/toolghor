import { NextRequest, NextResponse } from 'next/server';
import { completePasswordReset } from '@/lib/passwordReset';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { challengeId, resetToken, newPassword, confirmPassword } = body;

    const result = await completePasswordReset(challengeId, resetToken, newPassword, confirmPassword);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
      },
      { status: result.statusCode || (result.success ? 200 : 400) }
    );
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password/reset-password error]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error completing password reset.' },
      { status: 500 }
    );
  }
}
