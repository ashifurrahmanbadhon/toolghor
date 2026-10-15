import { NextRequest, NextResponse } from 'next/server';

// Sliding-window rate limiter
const ipRequestMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string, isPolling = false): boolean {
  if (isPolling) return true;
  const now = Date.now();
  const entry = ipRequestMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRequestMap.set(ip, { count: 1, expiresAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count += 1;
  return true;
}

// SSRF Security Guard
function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const cleanIp = ip.trim().toLowerCase();
  if (cleanIp === '127.0.0.1' || cleanIp === '0.0.0.0' || cleanIp === 'localhost') return true;
  if (cleanIp.startsWith('10.')) return true;
  if (cleanIp.startsWith('192.168.')) return true;
  if (cleanIp.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)) return true;
  if (cleanIp === '::1' || cleanIp === '::' || cleanIp.startsWith('fe80:') || cleanIp.startsWith('fc00:')) return true;
  return false;
}

function validateSafeUrl(rawUrl: string): { safe: boolean; error?: string; urlObj?: URL } {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, error: 'Only HTTP and HTTPS URLs are supported.' };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost')
    ) {
      return { safe: false, error: 'Access to localhost and internal network addresses is blocked.' };
    }
    if (isPrivateIp(hostname)) {
      return { safe: false, error: 'Access to private and cloud metadata addresses is blocked.' };
    }
    return { safe: true, urlObj: parsed };
  } catch {
    return { safe: false, error: 'Invalid URL format.' };
  }
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

// -------------------------------------------------------------
// Platform Detectors & Adapters
// -------------------------------------------------------------

function detectPlatform(urlStr: string): 'youtube' | 'instagram' | 'facebook' | 'direct' | 'unsupported' {
  const lower = urlStr.toLowerCase();
  if (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('music.youtube.com')
  ) {
    return 'youtube';
  }
  if (lower.includes('instagram.com')) {
    return 'instagram';
  }
  if (
    lower.includes('facebook.com') ||
    lower.includes('fb.watch') ||
    lower.includes('fb.com')
  ) {
    return 'facebook';
  }
  if (
    /\.(mp4|webm|mkv|mov|m4v|mp3|m4a|wav)(\?.*)?$/i.test(urlStr) ||
    lower.startsWith('http')
  ) {
    return 'direct';
  }
  return 'unsupported';
}

function extractYouTubeId(rawUrl: string): string | null {
  const str = rawUrl.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i,
    /music\.youtube\.com\/watch\?v=([\w-]{11})/i,
  ];
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

// Adapter: YouTube
async function resolveYouTube(rawUrl: string) {
  const videoId = extractYouTubeId(rawUrl);
  if (!videoId) {
    return {
      success: false,
      error: 'Invalid YouTube URL. Please provide a valid YouTube video or Shorts link.',
    };
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const isShorts = /shorts/i.test(rawUrl);
  const thumbMax = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const thumbHq = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  let title = `YouTube Video (${videoId})`;
  let author = 'YouTube Creator';

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
    }
  } catch {
    // Non-blocking fallback
  }

  const formats = [
    {
      formatKey: '1080',
      quality: '1080p Full HD',
      qualityLabel: '1080p Full HD',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      note: 'উচ্চমানের ১০৮০p ভিডিও (ভিডিও + অডিও)',
    },
    {
      formatKey: '720',
      quality: '720p HD (দ্রুততম)',
      qualityLabel: '720p HD (Fast)',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      isRecommended: true,
      note: 'দ্রুত ডাউনলোড ও স্পষ্ট ভিডিও',
    },
    {
      formatKey: '360',
      quality: '360p SD',
      qualityLabel: '360p SD',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      note: 'কম ডেটা খরচের জন্য উপযোগী',
    },
    {
      formatKey: '4k',
      quality: '4K Ultra HD (2160p)',
      qualityLabel: '4K Ultra HD',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      note: 'আল্ট্রা এইচডি কোয়ালিটি (যদি মূল ভিডিওতে থাকে)',
    },
    {
      formatKey: 'mp3',
      quality: 'MP3 Audio (320 kbps)',
      qualityLabel: 'MP3 (320 kbps)',
      type: 'audio',
      container: 'mp3',
      hasVideo: false,
      hasAudio: true,
      isRecommended: true,
      note: 'হাই কোয়ালিটি স্টেরিও অডিও গান',
    },
    {
      formatKey: 'm4a',
      quality: 'M4A Audio (AAC)',
      qualityLabel: 'M4A (AAC)',
      type: 'audio',
      container: 'm4a',
      hasVideo: false,
      hasAudio: true,
      note: 'অরিজিনাল ইউটিউব অডিও স্ট্রিম',
    },
  ];

  return {
    success: true,
    platform: 'youtube',
    id: videoId,
    title,
    author,
    url: canonicalUrl,
    is_shorts: isShorts,
    thumbnails: {
      max: thumbMax,
      hq: thumbHq,
    },
    formats,
  };
}

// Adapter: Instagram (Public Reels / Posts)
async function resolveInstagram(rawUrl: string) {
  // Extract Instagram shortcode
  const match = rawUrl.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  const shortcode = match ? match[1] : null;

  let title = 'Instagram Reel / Video';
  let author = 'Instagram User';
  let thumb = '';
  let directVideoUrl = '';

  try {
    // 1. Try public oEmbed
    const oembedRes = await fetch(
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(rawUrl)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(4500),
      }
    );
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      if (oembedData.title) title = oembedData.title;
      if (oembedData.author_name) author = `@${oembedData.author_name}`;
      if (oembedData.thumbnail_url) thumb = oembedData.thumbnail_url;
    }
  } catch {
    // Fallback
  }

  // 2. Try fetching embed page for video url
  if (shortcode) {
    try {
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      const embedRes = await fetch(embedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (embedRes.ok) {
        const html = await embedRes.text();

        // Extract video src or video_url from embed HTML
        const vidMatch =
          html.match(/class="EmbeddedVideoImage"[^>]*src="([^"]+)"/) ||
          html.match(/"video_url":"([^"]+)"/) ||
          html.match(/<video[^>]*src="([^"]+)"/);

        if (vidMatch && vidMatch[1]) {
          directVideoUrl = vidMatch[1].replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
        }

        const thumbMatch =
          html.match(/"display_url":"([^"]+)"/) ||
          html.match(/class="EmbeddedVideoImage"[^>]*src="([^"]+)"/);
        if (thumbMatch && thumbMatch[1] && !thumb) {
          thumb = thumbMatch[1].replace(/\\u0026/g, '&');
        }
      }
    } catch {
      // Ignore embed error
    }
  }

  // Format list based on genuine technical availability
  const formats = [];
  if (directVideoUrl) {
    formats.push({
      formatKey: 'ig-mp4',
      quality: 'Original HD (MP4)',
      qualityLabel: 'Original MP4',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
        directVideoUrl
      )}&filename=${encodeURIComponent('ToolGhor-Instagram-' + (shortcode || 'reel') + '.mp4')}`,
      isRecommended: true,
      note: 'সরাসরি ইনস্টাগ্রাম পাবলিক ভিডিও',
    });
    formats.push({
      formatKey: 'ig-mp3',
      quality: 'Audio Extracted (MP3)',
      qualityLabel: 'MP3 Audio',
      type: 'audio',
      container: 'mp3',
      hasVideo: false,
      hasAudio: true,
      downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
        directVideoUrl
      )}&filename=${encodeURIComponent('ToolGhor-Instagram-' + (shortcode || 'reel') + '.mp3')}`,
      note: 'ইনস্টাগ্রাম রিলসের ব্যাকগ্রাউন্ড অডিও',
    });
  } else {
    // If Instagram protected the video behind a login wall, provide honest platform notification
    return {
      success: false,
      platform: 'instagram',
      error:
        'এই ইনস্টাগ্রাম রিলটি প্রাইভেট বা ইনস্টাগ্রাম লগইন প্রয়োজন। শুধুমাত্র উন্মুক্ত (পাবলিক) ইনস্টাগ্রাম রিলস ও ভিডিও সরাসরি ডাউনলোড করা যায়।',
      suggestedAction: 'দয়া করে লিংকটি নিশ্চিত করুন যে এটি একটি উন্মুক্ত পাবলিক পোস্ট বা রিল।',
    };
  }

  return {
    success: true,
    platform: 'instagram',
    id: shortcode || 'reel',
    title,
    author,
    url: rawUrl,
    is_shorts: true,
    thumbnails: {
      max: thumb,
      hq: thumb,
    },
    formats,
  };
}

// Adapter: Facebook (Public Reels / Watch)
async function resolveFacebook(rawUrl: string) {
  let title = 'Facebook Video / Reel';
  let author = 'Facebook Creator';
  let thumb = '';
  let directVideoUrl = '';

  try {
    const res = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const html = await res.text();
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
      const ogVideoMatch =
        html.match(/<meta property="og:video" content="([^"]+)"/i) ||
        html.match(/<meta property="og:video:url" content="([^"]+)"/i) ||
        html.match(/<meta property="og:video:secure_url" content="([^"]+)"/i);

      if (ogTitleMatch && ogTitleMatch[1]) title = ogTitleMatch[1];
      if (ogImageMatch && ogImageMatch[1]) thumb = ogImageMatch[1].replace(/&amp;/g, '&');
      if (ogVideoMatch && ogVideoMatch[1]) {
        directVideoUrl = ogVideoMatch[1].replace(/&amp;/g, '&');
      }
    }
  } catch {
    // Ignore
  }

  if (!directVideoUrl) {
    return {
      success: false,
      platform: 'facebook',
      error:
        'এই ফেসবুক ভিডিওটি পাবলিক নয় অথবা ফেসবুকের লগইন সুরক্ষায় সুরক্ষিত। শুধুমাত্র উন্মুক্ত পাবলিক ফেসবুক রিলস ও ভিডিও সরাসরি ডাউনলোড সম্ভব।',
      suggestedAction: 'ভিডিওটির প্রাইভেসি পাবলিক (🌐 Public) কি না নিশ্চিত করুন।',
    };
  }

  const formats = [
    {
      formatKey: 'fb-mp4',
      quality: 'Original HD (MP4)',
      qualityLabel: 'Original MP4',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
        directVideoUrl
      )}&filename=${encodeURIComponent('ToolGhor-Facebook-Video.mp4')}`,
      isRecommended: true,
      note: 'উন্মুক্ত ফেসবুক রিল/ভিডিও',
    },
    {
      formatKey: 'fb-mp3',
      quality: 'Audio Extracted (MP3)',
      qualityLabel: 'MP3 Audio',
      type: 'audio',
      container: 'mp3',
      hasVideo: false,
      hasAudio: true,
      downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
        directVideoUrl
      )}&filename=${encodeURIComponent('ToolGhor-Facebook-Audio.mp3')}`,
      note: 'ভিডিওর অডিও ট্র্যাক',
    },
  ];

  return {
    success: true,
    platform: 'facebook',
    id: 'fb-video',
    title,
    author,
    url: rawUrl,
    is_shorts: /reel/i.test(rawUrl),
    thumbnails: {
      max: thumb,
      hq: thumb,
    },
    formats,
  };
}

// Adapter: Direct Video URL
async function resolveDirect(rawUrl: string) {
  try {
    const headRes = await fetch(rawUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });

    const cType = headRes.headers.get('content-type') || '';
    const cLength = headRes.headers.get('content-length');

    let sizeStr = '';
    if (cLength) {
      const bytes = parseInt(cLength, 10);
      if (bytes > 0) {
        sizeStr = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      }
    }

    const urlPath = new URL(rawUrl).pathname;
    const filename = urlPath.split('/').pop() || 'video.mp4';
    const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';

    const formats = [
      {
        formatKey: 'direct-original',
        quality: `Original (${ext.toUpperCase()}${sizeStr ? ' · ' + sizeStr : ''})`,
        qualityLabel: `Original (${ext.toUpperCase()})`,
        type: cType.includes('audio') ? 'audio' : 'video',
        container: ext,
        hasVideo: !cType.includes('audio'),
        hasAudio: true,
        downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
          rawUrl
        )}&filename=${encodeURIComponent('ToolGhor-' + filename)}`,
        isRecommended: true,
        note: 'সরাসরি ফাইল ডাউনলোড',
      },
    ];

    return {
      success: true,
      platform: 'direct',
      id: filename,
      title: filename,
      author: 'Direct Video Source',
      url: rawUrl,
      is_shorts: false,
      thumbnails: {
        max: '',
        hq: '',
      },
      formats,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to inspect video URL.';
    return {
      success: false,
      platform: 'direct',
      error: `সরাসরি ভিডিও ফাইলটি সংযোগ করা যায়নি: ${msg}`,
    };
  }
}

// -------------------------------------------------------------
// GET Handler
// -------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = (searchParams.get('action') || 'info').toLowerCase();
  const rawUrl = (searchParams.get('url') || '').trim();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!checkRateLimit(ip, action === 'progress')) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }

  // 1. Action: DETECT
  if (action === 'detect') {
    if (!rawUrl) {
      return NextResponse.json({ success: false, platform: 'unknown' });
    }
    const safeCheck = validateSafeUrl(rawUrl);
    if (!safeCheck.safe) {
      return NextResponse.json({ success: false, error: safeCheck.error });
    }
    const platform = detectPlatform(rawUrl);
    return NextResponse.json({
      success: true,
      platform,
      isYouTube: platform === 'youtube',
      isInstagram: platform === 'instagram',
      isFacebook: platform === 'facebook',
      isDirect: platform === 'direct',
    });
  }

  // 2. Action: PROGRESS (proxy polling for loader converter)
  if (action === 'progress') {
    const progressUrl = searchParams.get('progress_url');
    if (!progressUrl) {
      return NextResponse.json({ success: false, error: 'Invalid progress URL.' }, { status: 400 });
    }
    const safeCheck = validateSafeUrl(progressUrl);
    if (!safeCheck.safe) {
      return NextResponse.json({ success: false, error: safeCheck.error }, { status: 403 });
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

  // 3. Action: CONVERT (for YouTube formats)
  if (action === 'convert') {
    const videoId = extractYouTubeId(rawUrl) || searchParams.get('id');
    if (!videoId) {
      return NextResponse.json({ success: false, error: 'Invalid YouTube video or URL.' }, { status: 400 });
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const format = (searchParams.get('format') || '720').toLowerCase();
    const validFormats = ['4k', '1440', '1080', '720', '480', '360', 'mp3', 'm4a'];
    let fmt = validFormats.includes(format) ? format : '720';
    if (fmt === '480') fmt = '720';

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

  // 4. Action: PROXY_DOWNLOAD (Safe browser attachment download)
  if (action === 'proxy_download') {
    const targetUrl = searchParams.get('url') || '';
    const filename = searchParams.get('filename') || 'ToolGhor-video.mp4';

    const safeCheck = validateSafeUrl(targetUrl);
    if (!safeCheck.safe) {
      return NextResponse.json({ success: false, error: safeCheck.error }, { status: 403 });
    }

    try {
      const upstreamRes = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!upstreamRes.ok || !upstreamRes.body) {
        return NextResponse.json(
          { success: false, error: 'Unable to stream file from source.' },
          { status: 502 }
        );
      }

      const headers = new Headers();
      headers.set('Content-Type', upstreamRes.headers.get('content-type') || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      const len = upstreamRes.headers.get('content-length');
      if (len) headers.set('Content-Length', len);

      return new NextResponse(upstreamRes.body, {
        status: 200,
        headers,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Proxy download stream failed';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  // 5. Action: INFO (Default format inspection & metadata)
  if (!rawUrl) {
    return NextResponse.json(
      { success: false, error: 'ভিডিও লিংক প্রদান করা বাধ্যতামূলক। (A video URL is required.)' },
      { status: 400 }
    );
  }

  const safeCheck = validateSafeUrl(rawUrl);
  if (!safeCheck.safe) {
    return NextResponse.json({ success: false, error: safeCheck.error }, { status: 403 });
  }

  const platform = detectPlatform(rawUrl);

  switch (platform) {
    case 'youtube':
      return NextResponse.json(await resolveYouTube(rawUrl));
    case 'instagram':
      return NextResponse.json(await resolveInstagram(rawUrl));
    case 'facebook':
      return NextResponse.json(await resolveFacebook(rawUrl));
    case 'direct':
      return NextResponse.json(await resolveDirect(rawUrl));
    default:
      return NextResponse.json(
        {
          success: false,
          error:
            'এই প্ল্যাটফর্মটি এখনো সমর্থিত নয়। দয়া করে ইউটিউব, ইনস্টাগ্রাম রিলস, ফেসবুক বা সরাসরি ভিডিও ফাইলের লিংক ব্যবহার করুন।',
        },
        { status: 400 }
      );
  }
}
