import nodemailer from 'nodemailer';

interface SendOtpResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a 6-digit OTP verification code to the admin's Gmail.
 */
export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<SendOtpResult> {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;

  if (!user || !pass) {
    console.warn(
      `[Notifier] SMTP credentials not set in environment (SMTP_USER/SMTP_PASS). OTP ${otpCode} generated for ${toEmail}. Set SMTP_USER & SMTP_PASS in .env.local to enable live email delivery.`
    );
    // Even if live SMTP credentials aren't set in .env.local yet, log securely so server admin can see,
    // but the API caller NEVER receives the code.
    return {
      success: true,
      error: 'SMTP credentials not configured in environment variables, logged to server console.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: `"ToolGhor Security" <${user}>`,
      to: toEmail,
      subject: `ToolGhor Admin Password Reset Code: ${otpCode}`,
      text: `Your 6-digit ToolGhor admin verification code is: ${otpCode}. It will expire in 15 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 24px; color: #f8fafc; }
            .container { max-width: 480px; margin: 0 auto; background: #131824; border: 1px solid #1e293b; border-radius: 16px; padding: 32px 24px; }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 26px; font-weight: 800; color: #10b981; margin: 0; }
            .badge { display: inline-block; font-size: 12px; color: #94a3b8; background: #1e293b; padding: 4px 10px; border-radius: 20px; margin-top: 6px; }
            .content { text-align: center; }
            .desc { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px; }
            .code-box { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #10b981; background: #0b0f19; padding: 16px 24px; border-radius: 12px; border: 1px dashed #10b981; display: inline-block; margin-bottom: 20px; }
            .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">ToolGhor</h1>
              <div class="badge">Security Verification</div>
            </div>
            <div class="content">
              <p class="desc">We received a request to reset your admin console password. Use the verification code below to proceed:</p>
              <div class="code-box">${otpCode}</div>
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">This code is valid for <strong>15 minutes</strong>. If you did not request this reset, please ignore this email.</p>
            </div>
            <div class="footer">
              ToolGhor Central Console • Automated Security Dispatch
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Notifier] Live email successfully dispatched to ${toEmail}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Notifier] Failed to send email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a 6-digit OTP verification code via SMS to the admin's phone.
 */
export async function sendOtpSms(toPhone: string, otpCode: string): Promise<SendOtpResult> {
  const smsApiUrl = process.env.SMS_API_URL;
  const smsApiKey = process.env.SMS_API_KEY;

  if (smsApiUrl) {
    try {
      const response = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(smsApiKey ? { Authorization: `Bearer ${smsApiKey}` } : {}),
        },
        body: JSON.stringify({
          phone: toPhone,
          message: `Your ToolGhor admin verification code is: ${otpCode}. Valid for 15 minutes.`,
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS Gateway responded with HTTP ${response.status}`);
      }

      console.log(`[Notifier] Live SMS successfully sent to ${toPhone}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[Notifier] Failed to send SMS to ${toPhone}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  console.warn(
    `[Notifier] SMS_API_URL not configured in environment. OTP ${otpCode} generated for ${toPhone}. Set SMS_API_URL in .env.local to enable live SMS gateway.`
  );
  return {
    success: true,
    error: 'SMS_API_URL not set in environment variables, logged to server console.',
  };
}
