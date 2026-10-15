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
// Format Type Interface
// -------------------------------------------------------------
export interface NormalizedFormat {
  formatKey: string;
  quality: string;
  qualityLabel: string;
  type: 'video' | 'audio';
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
  size_mb?: number | null;
  downloadUrl?: string;
  isRecommended?: boolean;
  note?: string;
}

// -------------------------------------------------------------
// Platform Detectors
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

// -------------------------------------------------------------
// Documented Media Provider Integration: SaveAPI (saveapi.org)
// -------------------------------------------------------------
async function resolveSaveApi(rawUrl: string, apiKey: string) {
  const isYt = /youtube\.com|youtu\.be|music\.youtube\.com/i.test(rawUrl);

  if (isYt) {
    // 1. YouTube Endpoint: /v1/youtube/info
    const infoUrl = `https://api.saveapi.org/v1/youtube/info?url=${encodeURIComponent(rawUrl)}`;
    const infoRes = await fetch(infoUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!infoRes.ok) {
      const errJson = await infoRes.json().catch(() => ({}));
      return {
        success: false,
        error: errJson?.error?.message || `SaveAPI YouTube error (${infoRes.status})`,
      };
    }

    const data = await infoRes.json();
    if (!data.success) {
      return {
        success: false,
        error: data?.error?.message || 'SaveAPI YouTube resolve failed',
      };
    }

    const ytId = data.video_id || data.id || extractYouTubeId(rawUrl) || 'yt-video';
    const title = data.title || data.meta?.title || `YouTube Video (${ytId})`;
    const author = data.author || data.meta?.author || 'YouTube Creator';
    const thumb = data.thumbnail || data.meta?.thumbnail || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;

    const formats: NormalizedFormat[] = [];
    if (Array.isArray(data.formats) && data.formats.length > 0) {
      for (const f of data.formats) {
        const qualityName = f.quality || f.format || '720p';
        const sizeMb = typeof f.file_size === 'number' ? parseFloat((f.file_size / (1024 * 1024)).toFixed(1)) : null;
        formats.push({
          formatKey: qualityName,
          quality: qualityName,
          qualityLabel: qualityName,
          type: 'video',
          container: 'mp4',
          hasVideo: true,
          hasAudio: true,
          size_mb: sizeMb,
          isRecommended: qualityName === '720p',
          downloadUrl: `/api/video-downloader?action=saveapi_yt_create&url=${encodeURIComponent(
            rawUrl
          )}&format=${encodeURIComponent(qualityName)}`,
          note: `${qualityName} রেজোলিউশন ভিডিও`,
        });
      }
    }

    if (Array.isArray(data.audio_formats) && data.audio_formats.length > 0) {
      for (const af of data.audio_formats) {
        const q = af.quality || 'mp3';
        const sizeMb = typeof af.file_size === 'number' ? parseFloat((af.file_size / (1024 * 1024)).toFixed(1)) : null;
        formats.push({
          formatKey: q,
          quality: `${q.toUpperCase()} Audio`,
          qualityLabel: `${q.toUpperCase()} Audio`,
          type: 'audio',
          container: q,
          hasVideo: false,
          hasAudio: true,
          size_mb: sizeMb,
          isRecommended: q === 'mp3',
          downloadUrl: `/api/video-downloader?action=saveapi_yt_create&url=${encodeURIComponent(
            rawUrl
          )}&format=${encodeURIComponent(q)}`,
          note: 'হাই কোয়ালিটি স্টেরিও অডিও গান',
        });
      }
    }

    if (!formats.length) {
      formats.push(
        {
          formatKey: '720p',
          quality: '720p HD',
          qualityLabel: '720p HD (Fast)',
          type: 'video',
          container: 'mp4',
          hasVideo: true,
          hasAudio: true,
          isRecommended: true,
          downloadUrl: `/api/video-downloader?action=saveapi_yt_create&url=${encodeURIComponent(
            rawUrl
          )}&format=720p`,
          note: 'দ্রুত ডাউনলোড ও স্পষ্ট ভিডিও',
        },
        {
          formatKey: '1080p',
          quality: '1080p Full HD',
          qualityLabel: '1080p Full HD',
          type: 'video',
          container: 'mp4',
          hasVideo: true,
          hasAudio: true,
          downloadUrl: `/api/video-downloader?action=saveapi_yt_create&url=${encodeURIComponent(
            rawUrl
          )}&format=1080p`,
          note: 'উচ্চমানের ১০৮০p ভিডিও',
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
          downloadUrl: `/api/video-downloader?action=saveapi_yt_create&url=${encodeURIComponent(
            rawUrl
          )}&format=mp3`,
          note: 'হাই কোয়ালিটি স্টেরিও অডিও গান',
        }
      );
    }

    return {
      success: true,
      provider: 'saveapi',
      platform: 'youtube',
      id: ytId,
      title,
      author,
      url: rawUrl,
      is_shorts: /shorts/i.test(rawUrl),
      thumbnails: {
        max: thumb,
        hq: thumb,
      },
      formats,
    };
  } else {
    // 2. Multi-platform Endpoint: /v1/download (Instagram, Facebook, TikTok, Twitter/X, etc.)
    const dlUrl = `https://api.saveapi.org/v1/download?url=${encodeURIComponent(rawUrl)}`;
    const res = await fetch(dlUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson?.error?.message || `SaveAPI resolve error (${res.status})`,
      };
    }

    const data = await res.json();
    if (!data.success) {
      return {
        success: false,
        error: data?.error?.message || 'SaveAPI media resolve failed',
      };
    }

    const formats: NormalizedFormat[] = [];
    const title = data.meta?.title || data.meta?.text || `${data.platform || 'Social'} Video`;
    const cleanTitle = title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 40) || 'Video';
    const thumb = data.meta?.thumbnail || '';

    // Check formats array
    if (Array.isArray(data.formats) && data.formats.length > 0) {
      for (const f of data.formats) {
        const isAudio = f.type === 'audio' || f.format === 'mp3';
        const ext = isAudio ? 'mp3' : 'mp4';
        const fileUrl = f.url || '';
        formats.push({
          formatKey: f.format || (isAudio ? 'audio' : 'video'),
          quality: f.label || (isAudio ? 'MP3 Audio' : 'HD Video'),
          qualityLabel: f.label || (isAudio ? 'MP3 Audio' : 'HD Video'),
          type: isAudio ? 'audio' : 'video',
          container: ext,
          hasVideo: !isAudio,
          hasAudio: true,
          size_mb: typeof f.size_mb === 'number' ? f.size_mb : null,
          isRecommended: f.format === data.recommended_format || (!isAudio && formats.length === 0),
          downloadUrl: fileUrl
            ? `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
                fileUrl
              )}&filename=${encodeURIComponent(`ToolGhor-${cleanTitle}.${ext}`)}`
            : undefined,
          note: isAudio ? 'অডিও ট্র্যাক' : 'ক্লিন অরিজিনাল ভিডিও',
        });
      }
    }

    // Check medias array if formats was empty or missing video entries
    if (Array.isArray(data.medias) && data.medias.length > 0) {
      for (let i = 0; i < data.medias.length; i++) {
        const m = data.medias[i];
        if (m.type === 'video' && m.url) {
          const alreadyAdded = formats.some(
            (f) => f.type === 'video' && f.downloadUrl?.includes(encodeURIComponent(m.url))
          );
          if (!alreadyAdded) {
            const ext = m.ext || 'mp4';
            formats.push({
              formatKey: `media-video-${i}`,
              quality: m.quality
                ? `${m.quality} (${ext.toUpperCase()})`
                : `Original Video (${ext.toUpperCase()})`,
              qualityLabel: m.quality ? `${m.quality}` : `Original (${ext.toUpperCase()})`,
              type: 'video',
              container: ext,
              hasVideo: true,
              hasAudio: true,
              size_mb: typeof m.size_mb === 'number' ? m.size_mb : null,
              isRecommended: formats.filter((f) => f.type === 'video').length === 0,
              downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
                m.url
              )}&filename=${encodeURIComponent(`ToolGhor-${cleanTitle}.${ext}`)}`,
              note: 'সরাসরি হাই-স্পিড ভিডিও',
            });
          }
        }
      }
    }

    // Check music/audio
    if (data.music && data.music.url) {
      const alreadyAudio = formats.some((f) => f.type === 'audio');
      if (!alreadyAudio) {
        const ext = data.music.ext || 'mp3';
        formats.push({
          formatKey: 'media-audio',
          quality: 'Audio Extracted (MP3)',
          qualityLabel: 'MP3 Audio',
          type: 'audio',
          container: ext,
          hasVideo: false,
          hasAudio: true,
          size_mb: typeof data.music.size_mb === 'number' ? data.music.size_mb : null,
          isRecommended: true,
          downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
            data.music.url
          )}&filename=${encodeURIComponent(`ToolGhor-${cleanTitle}-Audio.${ext}`)}`,
          note: 'ব্যাকগ্রাউন্ড অরিজিনাল অডিও',
        });
      }
    }

    return {
      success: true,
      provider: 'saveapi',
      platform: data.platform || detectPlatform(rawUrl),
      id: data.video_id || 'video',
      title,
      author: data.meta?.author || `${data.platform || 'Social'} User`,
      url: rawUrl,
      is_shorts: data.platform === 'instagram' || data.platform === 'tiktok',
      thumbnails: {
        max: thumb,
        hq: thumb,
      },
      formats,
    };
  }
}

// -------------------------------------------------------------
// Native Fallback Adapters (ToolGhor Internal Resolvers)
// -------------------------------------------------------------

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

  const formats: NormalizedFormat[] = [
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
  const match = rawUrl.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  const shortcode = match ? match[1] : null;

  let title = 'Instagram Reel / Video';
  let author = 'Instagram User';
  let thumb = '';
  let directVideoUrl = '';

  try {
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

  const formats: NormalizedFormat[] = [];
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

// -------------------------------------------------------------
// SnapSave Integration (for Instagram & Facebook Reels with Sound)
// -------------------------------------------------------------
async function resolveSnapSave(rawUrl: string, platform: 'instagram' | 'facebook') {
  try {
    const { snapsave } = await import('snapsave-media-downloader');
    const res = await snapsave(rawUrl);
    if (!res || !res.success || !res.data) {
      return null;
    }

    const data = res.data;
    const medias = Array.isArray(data.media) ? data.media : [];
    const videoMedias = medias.filter((m: any) => m && m.type === 'video' && m.url);

    if (videoMedias.length === 0) {
      return null;
    }

    const title = data.description || (platform === 'instagram' ? 'Instagram Reel / Video' : 'Facebook Reel / Video');
    const cleanTitle =
      title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 40).trim() ||
      (platform === 'instagram' ? 'Instagram-Reel' : 'Facebook-Video');
    const thumb = data.preview || (medias[0] && medias[0].thumbnail) || '';

    const formats: NormalizedFormat[] = [];
    for (let i = 0; i < videoMedias.length; i++) {
      const vm = videoMedias[i];
      const resLabel = vm.resolution || (i === 0 ? 'HD Video (720p/1080p)' : 'SD Video (Standard)');
      const isHd = /hd|1080|720/i.test(resLabel) || i === 0;

      formats.push({
        formatKey: `snapsave-video-${i}`,
        quality: `${resLabel} - অডিও সহ`,
        qualityLabel: resLabel,
        type: 'video',
        container: 'mp4',
        hasVideo: true,
        hasAudio: true,
        isRecommended: isHd,
        downloadUrl: vm.url,
        note: 'সম্পূর্ণ অরিজিনাল সাউন্ড ও এইচডি ভিডিও',
      });
    }

    if (videoMedias[0] && videoMedias[0].url) {
      formats.push({
        formatKey: 'snapsave-audio',
        quality: 'MP3 অডিও সাউন্ড / গান',
        qualityLabel: 'MP3 Audio (Sound)',
        type: 'audio',
        container: 'mp3',
        hasVideo: false,
        hasAudio: true,
        isRecommended: true,
        downloadUrl: videoMedias[0].url,
        note: 'রিলসের সম্পূর্ণ ব্যাকগ্রাউন্ড সাউন্ড',
      });
    }

    return {
      success: true,
      provider: 'snapsave',
      platform,
      id: `${platform}-reel`,
      title,
      author: platform === 'instagram' ? 'Instagram Creator' : 'Facebook Creator',
      url: rawUrl,
      is_shorts: true,
      thumbnails: {
        max: thumb,
        hq: thumb,
      },
      formats,
    };
  } catch (err) {
    console.warn(`[VideoDownloader] snapsave resolution exception:`, err);
    return null;
  }
}

function decodeFbUrl(s: string): string | null {
  if (!s) return null;
  let str = s.replace(/&amp;/g, '&');
  str = str.replace(/\\\//g, '/').replace(/\\u0025/g, '%').replace(/\\u0026/g, '&');
  try {
    str = JSON.parse('"' + str.replace(/"/g, '\\"') + '"');
  } catch {}
  return str;
}

// Adapter: Facebook (Public Reels / Watch / Videos)
async function resolveFacebook(rawUrl: string) {
  let title = 'Facebook Video / Reel';
  let author = 'Facebook Creator';
  let thumb = '';
  let hdVideoUrl = '';
  let sdVideoUrl = '';
  let directVideoUrl = '';

  try {
    const res = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6500),
    });

    if (res.ok) {
      const html = await res.text();
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);

      if (ogTitleMatch && ogTitleMatch[1]) title = ogTitleMatch[1];
      if (ogImageMatch && ogImageMatch[1]) thumb = ogImageMatch[1].replace(/&amp;/g, '&');

      // 1. Check native HD stream (muxed with audio)
      const hdMatch =
        html.match(/"browser_native_hd_url"\s*:\s*"([^"]+)"/) ||
        html.match(/"playable_url_quality_hd"\s*:\s*"([^"]+)"/) ||
        html.match(/"hd_src"\s*:\s*"([^"]+)"/);
      if (hdMatch && hdMatch[1]) {
        hdVideoUrl = decodeFbUrl(hdMatch[1]) || '';
      }

      // 2. Check native SD stream (muxed with audio)
      const sdMatch =
        html.match(/"browser_native_sd_url"\s*:\s*"([^"]+)"/) ||
        html.match(/"playable_url"\s*:\s*"([^"]+)"/) ||
        html.match(/"sd_src"\s*:\s*"([^"]+)"/);
      if (sdMatch && sdMatch[1]) {
        sdVideoUrl = decodeFbUrl(sdMatch[1]) || '';
      }

      // 3. Fallback: OpenGraph video
      if (!hdVideoUrl && !sdVideoUrl) {
        const ogVideoMatch =
          html.match(/<meta property="og:video" content="([^"]+)"/i) ||
          html.match(/<meta property="og:video:url" content="([^"]+)"/i) ||
          html.match(/<meta property="og:video:secure_url" content="([^"]+)"/i);
        if (ogVideoMatch && ogVideoMatch[1]) {
          directVideoUrl = ogVideoMatch[1].replace(/&amp;/g, '&');
        }
      }
    }
  } catch {
    // Ignore fetch error
  }

  const primaryVideoUrl = hdVideoUrl || sdVideoUrl || directVideoUrl;

  if (!primaryVideoUrl) {
    return {
      success: false,
      platform: 'facebook',
      error:
        'এই ফেসবুক ভিডিওটি পাবলিক নয় অথবা ফেসবুকের লগইন সুরক্ষায় সুরক্ষিত। শুধুমাত্র উন্মুক্ত পাবলিক ফেসবুক রিলস ও ভিডিও সরাসরি ডাউনলোড সম্ভব।',
      suggestedAction: 'ভিডিওটির প্রাইভেসি পাবলিক (🌐 Public) কি না নিশ্চিত করুন।',
    };
  }

  const cleanTitle = title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 40) || 'Facebook-Video';
  const formats: NormalizedFormat[] = [];

  if (hdVideoUrl) {
    formats.push({
      formatKey: 'fb-hd',
      quality: 'HD Video (720p/1080p) - সাউন্ড সহ',
      qualityLabel: 'HD (With Audio)',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
        hdVideoUrl
      )}&filename=${encodeURIComponent(`ToolGhor-${cleanTitle}-HD.mp4`)}`,
      isRecommended: true,
      note: 'উচ্চমানের এইচডি ভিডিও ও অরিজিনাল সাউন্ড',
    });
  }

  if (sdVideoUrl) {
    formats.push({
      formatKey: 'fb-sd',
      quality: 'SD Video (Standard) - সাউন্ড সহ',
      qualityLabel: 'SD (With Audio)',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
        sdVideoUrl
      )}&filename=${encodeURIComponent(`ToolGhor-${cleanTitle}-SD.mp4`)}`,
      isRecommended: !hdVideoUrl,
      note: 'স্ট্যান্ডার্ড কোয়ালিটি ভিডিও ও সাউন্ড',
    });
  }

  if (!hdVideoUrl && !sdVideoUrl && directVideoUrl) {
    formats.push({
      formatKey: 'fb-mp4',
      quality: 'Original Video (MP4)',
      qualityLabel: 'Original MP4',
      type: 'video',
      container: 'mp4',
      hasVideo: true,
      hasAudio: true,
      downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
        directVideoUrl
      )}&filename=${encodeURIComponent(`ToolGhor-${cleanTitle}.mp4`)}`,
      isRecommended: true,
      note: 'ফেসবুক রিলস ভিডিও',
    });
  }

  // Audio track
  formats.push({
    formatKey: 'fb-mp3',
    quality: 'MP3 অডিও সাউন্ড / গান',
    qualityLabel: 'MP3 Audio (Sound)',
    type: 'audio',
    container: 'mp3',
    hasVideo: false,
    hasAudio: true,
    isRecommended: true,
    downloadUrl: `/api/video-downloader?action=proxy_download&url=${encodeURIComponent(
      primaryVideoUrl
    )}&filename=${encodeURIComponent(`ToolGhor-${cleanTitle}-Audio.mp3`)}`,
    note: 'রিলসের সম্পূর্ণ ব্যাকগ্রাউন্ড সাউন্ড',
  });

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
    let sizeMb: number | null = null;
    if (cLength) {
      const bytes = parseInt(cLength, 10);
      if (bytes > 0) {
        sizeMb = parseFloat((bytes / (1024 * 1024)).toFixed(1));
        sizeStr = `${sizeMb} MB`;
      }
    }

    const urlPath = new URL(rawUrl).pathname;
    const filename = urlPath.split('/').pop() || 'video.mp4';
    const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';

    const formats: NormalizedFormat[] = [
      {
        formatKey: 'direct-original',
        quality: `Original (${ext.toUpperCase()}${sizeStr ? ' · ' + sizeStr : ''})`,
        qualityLabel: `Original (${ext.toUpperCase()})`,
        type: cType.includes('audio') ? 'audio' : 'video',
        container: ext,
        hasVideo: !cType.includes('audio'),
        hasAudio: true,
        size_mb: sizeMb,
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

  // 2. Action: SAVEAPI_YT_CREATE (Authorized signed YouTube link creation via SaveAPI)
  if (action === 'saveapi_yt_create') {
    const apiKey = process.env.SAVEAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'SAVEAPI_KEY is not configured in Vercel environment variables. Using fallback converter.',
        },
        { status: 501 }
      );
    }

    const targetUrl = searchParams.get('url') || '';
    const format = searchParams.get('format') || '720';
    const safeCheck = validateSafeUrl(targetUrl);
    if (!safeCheck.safe) {
      return NextResponse.json({ success: false, error: safeCheck.error }, { status: 403 });
    }

    try {
      const createUrl = `https://api.saveapi.org/v1/youtube/create?url=${encodeURIComponent(
        targetUrl
      )}&format=${encodeURIComponent(format)}`;
      const createRes = await fetch(createUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            success: false,
            error: errJson?.error?.message || 'Failed to generate YouTube download link via SaveAPI.',
          },
          { status: 502 }
        );
      }

      const createData = await createRes.json();
      const dlUrl = createData.url || createData.download_url;
      if (!createData.success || !dlUrl) {
        return NextResponse.json(
          {
            success: false,
            error: createData?.error?.message || 'No direct download link returned from SaveAPI.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        download_url: dlUrl,
        filename: createData.filename || null,
        expires_at: createData.expires || createData.expires_at || null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SaveAPI YouTube create failed';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  // 3. Action: PROGRESS (proxy polling for native fallback converter)
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

  // 4. Action: CONVERT (fallback conversion for YouTube formats when no API key configured)
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

  // 5. Action: PROXY_DOWNLOAD (Safe browser attachment stream with SSRF validation)
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

  // 6. Action: INFO (Default format inspection & metadata)
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

  // A. Priority 1 for Instagram & Facebook: SnapSave (guarantees combined video + audio stream with sound)
  if (platform === 'instagram' || platform === 'facebook') {
    try {
      const snapResult = await resolveSnapSave(rawUrl, platform);
      if (snapResult && snapResult.success && snapResult.formats.length > 0) {
        return NextResponse.json(snapResult);
      }
    } catch (err) {
      console.warn(`[VideoDownloader] SnapSave resolution fallback for ${platform}:`, err);
    }
  }

  // B. Primary for YouTube & generic social provider: SaveAPI
  const saveApiKey = process.env.SAVEAPI_KEY;
  if (saveApiKey) {
    try {
      const saveApiResult = await resolveSaveApi(rawUrl, saveApiKey);
      if (saveApiResult.success) {
        return NextResponse.json(saveApiResult);
      }
      console.warn('[VideoDownloader] SaveAPI returned error, falling back to native resolver:', saveApiResult.error);
    } catch (err) {
      console.warn('[VideoDownloader] SaveAPI fetch exception, falling back to native resolver:', err);
    }
  }

  // C. Fallback: Native ToolGhor Platform Adapters
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
