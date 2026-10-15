import { NextRequest, NextResponse } from 'next/server';

// In-memory sliding window rate limiter (max 120 requests per minute per IP to accommodate polling)
const ipRequestMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string, isPolling = false): boolean {
  if (isPolling) return true; // Don't exhaust rate limit on status polling
  const now = Date.now();
  const entry = ipRequestMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRequestMap.set(ip, { count: 1, expiresAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) {
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
  const { searchParams } = new URL(req.url);
  const action = (searchParams.get('action') || 'info').toLowerCase();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!checkRateLimit(ip, action === 'progress')) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }

  // 1. Action: PROGRESS (proxy status polling for direct download)
  if (action === 'progress') {
    const progressUrl = searchParams.get('progress_url');
    if (!progressUrl || !/^https?:\/\//i.test(progressUrl)) {
      return NextResponse.json({ success: false, error: 'Invalid progress URL.' }, { status: 400 });
    }

    try {
      const pRes = await fetch(progressUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!pRes.ok) {
        return NextResponse.json({ success: false, error: 'Progress service unavailable.' }, { status: 502 });
      }

      const pData = await pRes.json();
      return NextResponse.json({
        success: true,
        progress: typeof pData.progress === 'number' ? pData.progress : null,
        text: pData.text || '',
        download_url: pData.download_url || null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Progress request failed';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  // 2. Action: CONVERT (initiate backend conversion to produce direct browser download link)
  if (action === 'convert') {
    const rawUrl = (searchParams.get('url') || '').trim();
    const format = (searchParams.get('format') || '720').toLowerCase();

    const videoId = extractYouTubeId(rawUrl);
    if (!videoId) {
      return NextResponse.json({ success: false, error: 'Invalid YouTube URL.' }, { status: 400 });
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const validFormats = ['4k', '1440', '1080', '720', '480', '360', 'mp3', 'm4a'];
    let fmt = validFormats.includes(format) ? format : '720';
    if (fmt === '480') fmt = '720'; // loader.to does not provide 480p progressive streams

    try {
      const initUrl = `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=${fmt}&url=${encodeURIComponent(
        canonicalUrl
      )}`;
      const initRes = await fetch(initUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!initRes.ok) {
        return NextResponse.json({ success: false, error: 'Conversion service unavailable.' }, { status: 502 });
      }

      const initData = await initRes.json();
      return NextResponse.json({
        success: true,
        progress_url: initData.progress_url || null,
        download_url: initData.download_url || null,
        title: initData.title || null,
        id: videoId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Conversion request failed';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  // 3. Action: INFO (default metadata & supported formats list)
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

  // Fetch official YouTube oEmbed metadata (instant, reliable, <300ms)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const oembedRes = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(3500),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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

  // Complete, high-speed direct download formats (up to 4K UHD)
  const formats = [
    {
      formatKey: '4k',
      quality: '4K Ultra HD (2160p)',
      qualityLabel: '4K Ultra HD (2160p)',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      label: '4K Ultra HD MP4 (2160p)',
      isRecommended: true,
      isDirect: true,
    },
    {
      formatKey: '1440',
      quality: '2K Quad HD (1440p)',
      qualityLabel: '2K Quad HD (1440p)',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      label: '2K Quad HD MP4 (1440p)',
      isRecommended: false,
      isDirect: true,
    },
    {
      formatKey: '1080',
      quality: '1080p (Full HD)',
      qualityLabel: '1080p (Full HD)',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      label: '1080p Full HD MP4',
      isRecommended: true,
      isDirect: true,
    },
    {
      formatKey: '720',
      quality: '720p (HD)',
      qualityLabel: '720p (HD)',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      label: '720p HD MP4',
      isRecommended: true,
      isDirect: true,
    },
    {
      formatKey: '360',
      quality: '360p (Fast)',
      qualityLabel: '360p (SD Fast)',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      label: '360p SD MP4',
      isRecommended: false,
      isDirect: true,
    },
    {
      formatKey: 'mp3',
      quality: 'Audio MP3 320kbps (উচ্চ মান)',
      qualityLabel: 'MP3 320kbps (উচ্চ মান)',
      type: 'audio',
      container: 'mp3',
      hasVideo: false,
      hasAudio: true,
      label: 'Audio MP3 320kbps',
      isRecommended: true,
      isDirect: true,
    },
    {
      formatKey: 'm4a',
      quality: 'Audio M4A / AAC (128kbps)',
      qualityLabel: 'M4A / AAC (অরিজিনাল অডিও)',
      type: 'audio',
      container: 'm4a',
      hasVideo: false,
      hasAudio: true,
      label: 'Audio M4A',
      isRecommended: false,
      isDirect: true,
    },
  ];

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
    direct_available: true,
    formats,
  });
}
