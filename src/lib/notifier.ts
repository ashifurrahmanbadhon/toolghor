import nodemailer from 'nodemailer';

export interface SendOtpResult {
  success: boolean;
  error?: string;
  provider?: 'resend' | 'smtp' | 'mock';
  messageId?: string;
}

// In-memory store for automated testing without sending real emails
export const __testEmailStore: {
  toEmail: string;
  otpCode: string;
  timestamp: number;
}[] = [];

/**
 * Sends a cryptographically secure 6-digit Email OTP verification code.
 * Supports Resend API (via RESEND_API_KEY) and SMTP (via SMTP_USER, SMTP_PASS, etc.).
 * In test mode or when mock is enabled, saves to test store without external calls.
 */
export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<SendOtpResult> {
  const normalizedEmail = (toEmail || '').trim().toLowerCase();

  // 1. Mock provider for automated tests
  if (process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_EMAIL_MOCK === 'true') {
    __testEmailStore.push({
      toEmail: normalizedEmail,
      otpCode,
      timestamp: Date.now(),
    });
    return {
      success: true,
      provider: 'mock',
      messageId: `mock-${Date.now()}`,
    };
  }

  // 2. Resend API support (if RESEND_API_KEY is configured)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'ToolGhor Security <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [normalizedEmail],
          subject: `ToolGhor Password Reset Code: ${otpCode}`,
          text: `Your 6-digit ToolGhor password reset verification code is: ${otpCode}. This code will expire in 5 minutes.`,
          html: getEmailHtml(otpCode),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Resend responded with HTTP ${res.status}`);
      }

      const resendData = await res.json();
      return {
        success: true,
        provider: 'resend',
        messageId: resendData.id,
      };
    } catch (err: any) {
      console.error('[Notifier] Resend delivery failed:', err.message);
      // Fall through to SMTP if configured, otherwise return error
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return {
          success: false,
          error: `Email delivery failed via Resend: ${err.message}`,
        };
      }
    }
  }

  // 3. SMTP Provider support (Nodemailer / Gmail / custom SMTP)
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();
  const pass = (rawPass || '').replace(/["']/g, '').replace(/\s+/g, '');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE != null ? process.env.SMTP_SECURE === 'true' : port === 465;
  const from = process.env.EMAIL_FROM || (user ? `"ToolGhor Security" <${user}>` : '"ToolGhor Security" <noreply@toolghor.vercel.app>');

  if (!user || !pass) {
    const isDev = process.env.NODE_ENV !== 'production';
    console.warn(`\n================================================================================`);
    console.warn(`[NOTIFIER] 📧 No email provider configured in environment variables.`);
    console.warn(`[NOTIFIER] Target recipient: ${normalizedEmail}`);
    console.warn(`[NOTIFIER] 🔑 6-Digit OTP Code: ${otpCode}`);
    console.warn(`[NOTIFIER] To receive real emails, set RESEND_API_KEY or SMTP_USER & SMTP_PASS in environment variables.`);
    console.warn(`================================================================================\n`);

    if (isDev) {
      return {
        success: true,
        provider: 'mock',
        messageId: `dev-${Date.now()}`,
      };
    }

    return {
      success: false,
      error: 'Email provider credentials are not configured. Please set RESEND_API_KEY or SMTP_USER & SMTP_PASS in .env.local.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass: pass.replace(/\s+/g, ''),
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from,
      to: normalizedEmail,
      subject: `ToolGhor Password Reset Code: ${otpCode}`,
      text: `Your 6-digit ToolGhor password reset verification code is: ${otpCode}. This code will expire in 5 minutes. If you did not request this, please ignore this email.`,
      html: getEmailHtml(otpCode),
    });

    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`[Notifier] SMTP email delivery failed:`, err.message);
    return {
      success: false,
      error: `SMTP delivery failed: ${err.message}`,
    };
  }
}

/**
 * Builds standard secure HTML email template for 6-digit OTP verification.
 */
function getEmailHtml(otpCode: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ToolGhor Password Reset Verification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 24px; color: #f8fafc; }
        .wrapper { max-width: 500px; margin: 0 auto; background: #131824; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 18px; padding: 36px 28px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4); }
        .header { text-align: center; margin-bottom: 26px; }
        .logo { font-size: 28px; font-weight: 800; color: #10b981; margin: 0; letter-spacing: -0.5px; }
        .badge { display: inline-block; font-size: 11.5px; font-weight: 700; color: #34d399; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 12px; border-radius: 999px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .content { text-align: center; }
        .desc { font-size: 14.5px; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px; }
        .code-box { font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #10b981; background: #0b0f19; padding: 18px 26px; border-radius: 14px; border: 1.5px dashed #10b981; display: inline-block; margin-bottom: 22px; font-family: 'Courier New', Courier, monospace; }
        .notice-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px 16px; margin: 0 0 24px; text-align: left; }
        .notice-text { font-size: 12.5px; color: #94a3b8; line-height: 1.5; margin: 0; }
        .footer { font-size: 11.5px; color: #64748b; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1 class="logo">ToolGhor</h1>
          <span class="badge">Password Reset Request</span>
        </div>
        <div class="content">
          <p class="desc">We received a request to reset the password for your ToolGhor account. Please use the six-digit verification code below:</p>
          <div class="code-box">${otpCode}</div>
          <div class="notice-card">
            <p class="notice-text">
              ⏱️ <strong>Security Notice:</strong> This code is single-use and will expire in <strong>5 minutes</strong>. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </div>
        <div class="footer">
          ToolGhor Automated Security Dispatch • Do not reply to this email
        </div>
      </div>
    </body>
    </html>
  `;
}
