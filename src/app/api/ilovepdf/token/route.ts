import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';
import { getILovePdfKeys, isRotationStatus, logKeyRotation } from '@/lib/apiKeys';

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
      SELECT is_active, ilovepdf_active
      FROM section_api_keys
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0];
    if (row && (!row.is_active || !row.ilovepdf_active)) {
      return NextResponse.json(
        { success: false, error: 'iLovePDF service is currently disabled.' },
        { status: 403 }
      );
    }

    const creds = await getILovePdfKeys();
    if (!creds || creds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'iLovePDF credentials not configured.' },
        { status: 503 }
      );
    }

    let lastErrorRes: NextResponse | null = null;

    for (let i = 0; i < creds.length; i++) {
      const cred = creds[i];
      const publicKey = cred.public;
      const secretKey = cred.secret;

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

      // 2. If public key exists, authenticate with iLovePDF auth endpoint:
      if (publicKey) {
        try {
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

          if (isRotationStatus(authRes.status)) {
            logKeyRotation('ilovepdf', i, authRes.status);
            lastErrorRes = NextResponse.json(
              { success: false, error: `iLovePDF auth failed with status ${authRes.status}` },
              { status: authRes.status }
            );
            continue;
          }

          return NextResponse.json(
            { success: false, error: `iLovePDF auth failed: HTTP ${authRes.status}` },
            { status: authRes.status }
          );
        } catch (fetchErr: any) {
          console.warn('[iLovePDF Token Auth Exception]:', fetchErr?.message);
        }
      }
    }

    if (lastErrorRes) return lastErrorRes;

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
