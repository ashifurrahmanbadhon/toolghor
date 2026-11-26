import { NextRequest, NextResponse } from 'next/server';

const LEGIT_BOT_AGENTS = [
  'googlebot',
  'bingbot',
  'facebookexternalhit',
  'facebookcatalog',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'whatsapp',
  'telegrambot',
  'duckduckbot',
  'applebot',
  'vercel',
];

const BLOCKED_BOT_AGENTS = [
  'python-requests',
  'python-urllib',
  'curl/',
  'wget/',
  'scrapy',
  'go-http-client',
  'okhttp',
  'java/',
  'libwww-perl',
  'httpclient',
  'aiohttp',
  'node-fetch',
  'axios/',
];

export function proxy(request: NextRequest) {
  const ua = (request.headers.get('user-agent') || '').trim().toLowerCase();

  // Block requests with empty or missing User-Agent
  if (!ua) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Always allow verified/legit crawlers and link-preview bots before block checks
  for (const legit of LEGIT_BOT_AGENTS) {
    if (ua.includes(legit)) {
      return NextResponse.next();
    }
  }

  // Always allow real browsers
  if (ua.includes('mozilla') && (ua.includes('applewebkit') || ua.includes('gecko'))) {
    return NextResponse.next();
  }

  // Block known automated HTTP/scraping clients
  for (const blocked of BLOCKED_BOT_AGENTS) {
    if (ua.includes(blocked)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|otf)$).*)',
  ],
};
