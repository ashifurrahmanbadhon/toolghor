import { NextRequest, NextResponse } from 'next/server';

// In-memory sliding window rate limiter (max 30 requests per minute per IP)
const ipRequestMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRequestMap.set(ip, { count: 1, expiresAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 30) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function extractYouTubeId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const str = rawUrl.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;

  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i,
    /music\.youtube\.com\/watch\?v=([\w-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawUrl = (searchParams.get('url') || '').trim();

  if (!rawUrl) {
    return NextResponse.json(
      { success: false, error: 'YouTube video URL is required.' },
      { status: 400 }
    );
  }

  const videoId = extractYouTubeId(rawUrl);
  if (!videoId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid YouTube URL. Please provide a valid YouTube video or Shorts link.',
      },
      { status: 400 }
    );
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const isShorts = /shorts/i.test(rawUrl);
  const thumbMax = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const thumbHq = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  let title = `YouTube Video (${videoId})`;
  let author = 'YouTube Creator';
  let authorUrl = '';

  // 1. Fetch official YouTube oEmbed metadata (instant, reliable, <300ms)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const oembedRes = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(3500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ToolGhor/1.0',
      },
    });
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      if (oembedData.title) title = oembedData.title;
      if (oembedData.author_name) author = oembedData.author_name;
      if (oembedData.author_url) authorUrl = oembedData.author_url;
    }
  } catch {
    // Non-blocking fallback
  }

  // 2. Fetch direct streams from fast stream resolvers
  let directAvailable = false;
  let formats: any[] = [];

  const streamEndpoints = [
    `https://invidious.f5.si/api/v1/videos/${videoId}`,
    `https://y.com.sb/api/v1/videos/${videoId}`,
  ];

  for (const endpoint of streamEndpoints) {
    try {
      const res = await fetch(endpoint, {
        signal: AbortSignal.timeout(3000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.title && title.includes(videoId)) {
          title = data.title;
        }
        if (data && data.author && author === 'YouTube Creator') {
          author = data.author;
        }

        const formatList: any[] = [];

        // Direct combined video+audio formats (e.g. 720p, 360p MP4)
        if (Array.isArray(data.formatStreams) && data.formatStreams.length > 0) {
          data.formatStreams.forEach((s: any) => {
            if (s.url) {
              formatList.push({
                quality: s.resolution || '720p (HD)',
                type: 'video',
                container: s.container || 'mp4',
                hasVideo: true,
                hasAudio: true,
                url: s.url,
                label: `${s.resolution || 'MP4'} Video`,
              });
            }
          });
        }

        // Adaptive formats (high-res 1080p video and MP3/M4A audio)
        if (Array.isArray(data.adaptiveFormats)) {
          // Find best MP4 audio stream
          const audioMp4 = data.adaptiveFormats.find(
            (f: any) => f.url && (f.itag === '140' || f.type?.includes('audio/mp4'))
          );
          if (audioMp4) {
            formatList.push({
              quality: 'Audio M4A / MP3 (High Quality)',
              type: 'audio',
              container: 'm4a',
              hasVideo: false,
              hasAudio: true,
              url: audioMp4.url,
              label: 'Audio (M4A / MP3)',
            });
          }

          // Find 720p or 1080p if not already in formatStreams
          const video1080 = data.adaptiveFormats.find(
            (f: any) => f.url && f.resolution === '1080p' && f.type?.includes('video/mp4')
          );
          if (video1080 && !formatList.some((f) => f.quality?.includes('1080p'))) {
            formatList.push({
              quality: '1080p (Full HD)',
              type: 'video',
              container: 'mp4',
              hasVideo: true,
              hasAudio: false,
              url: video1080.url,
              label: '1080p Full HD Video',
            });
          }
        }

        if (formatList.length > 0) {
          directAvailable = true;
          formats = formatList;
          break; // Stop after first working endpoint
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return NextResponse.json({
    success: true,
    id: videoId,
    url: canonicalUrl,
    title,
    author,
    author_url: authorUrl,
    is_shorts: isShorts,
    thumbnails: {
      max: thumbMax,
      hq: thumbHq,
    },
    direct_available: directAvailable,
    formats,
  });
}
