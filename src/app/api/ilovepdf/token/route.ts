import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  return handleTokenRequest();
}

export async function POST() {
  return handleTokenRequest();
}

async function handleTokenRequest() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT is_active, ilovepdf_active, ilovepdf_public_key, ilovepdf_secret_key
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (!row || !row.is_active || !row.ilovepdf_active) {
      return NextResponse.json(
        { success: false, error: 'iLovePDF service is currently disabled.' },
        { status: 403 }
      );
    }

    const secretKey = (row.ilovepdf_secret_key || process.env.ILOVEPDF_SECRET_KEY || '').trim();
    const publicKey = (row.ilovepdf_public_key || process.env.ILOVEPDF_PUBLIC_KEY || '').trim();

    if (!publicKey && !secretKey) {
      return NextResponse.json(
        { success: false, error: 'iLovePDF credentials not configured.' },
        { status: 503 }
      );
    }

    // 1. If both public and secret keys exist, self-sign JWT using HS256:
    if (publicKey && secretKey) {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          iss: publicKey,
          iat: Math.floor(Date.now() / 1000),
        })
      ).toString('base64url');
      const sig = crypto.createHmac('sha256', secretKey).update(`${header}.${payload}`).digest('base64url');
      const token = `${header}.${payload}.${sig}`;
      return NextResponse.json({ success: true, token });
    }

    // 2. If only public key exists, request from iLovePDF auth endpoint:
    if (publicKey) {
      const authRes = await fetch('https://api.ilovepdf.com/v1/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_key: publicKey }),
        signal: AbortSignal.timeout(15000),
      });
      if (authRes.ok) {
        const data = await authRes.json();
        if (data.token) {
          return NextResponse.json({ success: true, token: data.token });
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'iLovePDF requires a Project Public Key along with Secret Key.',
      },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
