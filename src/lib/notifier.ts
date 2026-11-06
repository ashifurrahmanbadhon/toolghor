import nodemailer from 'nodemailer';

export interface NotificationResult {
  success: boolean;
  error?: string;
  provider?: 'resend' | 'smtp' | 'mock';
  messageId?: string;
}

/**
 * Standard security notification dispatcher
 */
export async function sendSecurityAlert(toEmail: string, subject: string, message: string): Promise<NotificationResult> {
  const normalizedEmail = (toEmail || '').trim().toLowerCase();
  if (process.env.NODE_ENV === 'test') {
    return { success: true, provider: 'mock', messageId: `mock-${Date.now()}` };
  }

  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();
  const pass = (rawPass || '').replace(/["']/g, '').replace(/\s+/g, '');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE != null ? process.env.SMTP_SECURE === 'true' : port === 465;
  const from = process.env.EMAIL_FROM || (user ? `"ToolGhor Security" <${user}>` : '"ToolGhor Security" <noreply@toolghor.vercel.app>');

  if (!user || !pass) {
    return { success: true, provider: 'mock', messageId: `mock-dev-${Date.now()}` };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: { user, pass: pass.replace(/\s+/g, '') },
      connectionTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from,
      to: normalizedEmail,
      subject,
      text: message,
    });

    return { success: true, provider: 'smtp', messageId: info.messageId };
  } catch (err: any) {
    console.error('[Notifier] Alert delivery failed:', err.message);
    return { success: false, error: err.message };
  }
}
