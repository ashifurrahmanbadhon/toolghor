import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

// In-memory sliding window rate limiter (max 20 requests per minute per IP)
const ipRequestMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRequestMap.set(ip, { count: 1, expiresAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Clean up expired rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of ipRequestMap.entries()) {
      if (value.expiresAt < now) {
        ipRequestMap.delete(key);
      }
    }
  }, 300_000);
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
  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;

  // Standard YouTube URL patterns: watch, youtu.be, shorts, embed, live, music
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

  let videoDetails: {
    title: string;
    author: string;
    authorUrl?: string;
  } = {
    title: `YouTube Video (${videoId})`,
    author: 'YouTube Creator',
  };

  // 1. Fetch official YouTube oEmbed metadata (safe, reliable, zero third-party dependencies)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const oembedRes = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'ToolGhor/1.0 (+https://toolghor.com)',
      },
    });
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      videoDetails = {
        title: oembedData.title || videoDetails.title,
        author: oembedData.author_name || videoDetails.author,
        authorUrl: oembedData.author_url || '',
      };
    }
  } catch {
    // Non-blocking: fallback details preserved
  }

  // 2. Direct stream extraction check
  let directAvailable = false;
  let directFormats: any[] = [];
  let restrictionReason = '';

  try {
    // Check if ytdl-core can resolve stream formats directly
    const ytdlOptions: any = {
      requestOptions: {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      },
    };

    if (process.env.YOUTUBE_COOKIES) {
      ytdlOptions.requestOptions.headers['Cookie'] = process.env.YOUTUBE_COOKIES;
    }

    const infoPromise = ytdl.getInfo(canonicalUrl, ytdlOptions);
    // Timeout ytdl resolution after 6s to comply with Vercel serverless bounds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Stream resolution timed out')), 6000)
    );

    const info: any = await Promise.race([infoPromise, timeoutPromise]);

    if (info && info.formats && info.formats.length > 0) {
      // Filter accessible video and audio streams
      const accessibleFormats = info.formats
        .filter((f: any) => f.url && (f.hasVideo || f.hasAudio))
        .map((f: any) => ({
          itag: f.itag,
          quality: f.qualityLabel || (f.hasAudio ? 'Audio' : 'Video'),
          mimeType: f.mimeType?.split(';')[0] || (f.hasVideo ? 'video/mp4' : 'audio/mp4'),
          container: f.container || (f.hasVideo ? 'mp4' : 'm4a'),
          hasVideo: !!f.hasVideo,
          hasAudio: !!f.hasAudio,
          url: f.url,
          contentLength: f.contentLength || null,
        }));

      if (accessibleFormats.length > 0) {
        directAvailable = true;
        directFormats = accessibleFormats.slice(0, 6);
      }
    }
  } catch (err: any) {
    restrictionReason = err?.message || 'Cloud IP rate limited';
  }

  return NextResponse.json({
    success: true,
    id: videoId,
    url: canonicalUrl,
    title: videoDetails.title,
    author: videoDetails.author,
    author_url: videoDetails.authorUrl || '',
    is_shorts: isShorts,
    thumbnails: {
      max: thumbMax,
      hq: thumbHq,
    },
    direct_available: directAvailable,
    formats: directFormats,
    compliance: {
      is_restricted: !directAvailable,
      reason: directAvailable
        ? 'Direct stream resolved'
        : 'YouTube cloud bot-detection limits arbitrary serverless stream extraction. For full compliance and safety, authorized methods are provided below.',
      alternatives: [
        {
          id: 'creator_studio',
          titleEn: 'Download via YouTube Studio (For Video Owners)',
          titleBn: 'ইউটিউব স্টুডিও থেকে সরাসরি ডাউনলোড (ভিডিও ওনারদের জন্য)',
          descEn:
            'If this video belongs to your channel, go to YouTube Studio > Content > Click (⋮) on the video > Select "Download" to save the original high quality MP4 file.',
          descBn:
            'ভিডিওটি আপনার নিজের চ্যানেলের হলে, YouTube Studio > Content এ যান > ভিডিওর পাশে তিনটি বিন্দুতে (⋮) ক্লিক করুন > মূল MP4 ফাইলটি সেভ করতে "Download" নির্বাচন করুন।',
        },
        {
          id: 'google_takeout',
          titleEn: 'Google Takeout Bulk Archive',
          titleBn: 'গুগল টেকআউট দিয়ে এক ক্লিকে ব্যাকআপ',
          descEn:
            'Export all videos and content you have uploaded to YouTube in bulk via takeout.google.com with official Google authorization.',
          descBn:
            'আপনার আপলোড করা সকল ইউটিউব ভিডিও সম্পূর্ণ মূল কোয়ালিটিতে এক ক্লিকে ডাউনলোড করতে takeout.google.com ব্যবহার করুন।',
        },
        {
          id: 'hd_thumbnail',
          titleEn: '1-Click Direct HD Thumbnail Download',
          titleBn: 'এক ক্লিকে সরাসরি HD থাম্বনেইল ডাউনলোড',
          descEn: 'Directly download the official 1280x720 HD thumbnail image in JPG format.',
          descBn: 'অফিসিয়াল ১২৮০×৭২০ রেজোলিউশনের ফুল HD থাম্বনেইল সরাসরি ১-ক্লিকে নামিয়ে নিন।',
        },
      ],
    },
  });
}
