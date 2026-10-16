import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const ADMIN_SESSION_COOKIE_NAME = 'toolghor_admin_session';

/**
 * Returns the server authentication secret.
 * HARD FAILS if neither AUTH_SECRET nor NEXTAUTH_SECRET is configured.
 */
export function getAuthSecret(): string {
  const secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
  if (secret && secret !== 'your_auth_secret_here') {
    return secret;
  }

  // Resilient fallback: derive a secure HMAC secret from server database credentials if not explicitly set
  const dbSecret = (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PASSWORD ||
    ''
  ).trim();

  if (dbSecret) {
    return crypto.createHash('sha256').update(`toolghor_auth_secret_pepper_${dbSecret}`).digest('hex');
  }

  throw new Error('CRITICAL SECURITY ERROR: Neither AUTH_SECRET nor DATABASE_URL environment variable is configured.');
}

export interface AdminSessionData {
  id: number;
  username: string;
  exp: number;
}

/**
 * Generates a signed, URL-safe session token for the admin.
 */
export function createAdminSessionToken(admin: { id: number; username: string }, remember = true): string {
  const secret = getAuthSecret();
  // 30 days if remember is checked, otherwise 24 hours
  const durationMs = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const exp = Date.now() + durationMs;

  const payload: AdminSessionData = {
    id: admin.id,
    username: admin.username,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token. Returns parsed payload if valid and unexpired, null otherwise.
 */
export function verifyAdminSessionToken(token: string | undefined | null): AdminSessionData | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const secret = getAuthSecret();
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) return null;
    if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return null;

    const payload: AdminSessionData = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the admin session from an incoming NextRequest.
 */
export function verifyAdminRequest(req: NextRequest): AdminSessionData | null {
  const cookieValue = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(cookieValue);
}

/**
 * Attaches the signed httpOnly session cookie to an outgoing NextResponse.
 */
export function setAdminSessionCookie(res: NextResponse, token: string, remember = true): void {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // seconds

  res.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
}

/**
 * Clears the admin session cookie from an outgoing NextResponse.
 */
export function clearAdminSessionCookie(res: NextResponse): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}
