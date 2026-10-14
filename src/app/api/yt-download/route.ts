import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = (searchParams.get('url') || '').trim();
  let format = (searchParams.get('format') || '720').toLowerCase().trim();

  if (!rawUrl) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required.' },
      { status: 400 }
    );
  }

  const validFormats = ['360', '480', '720', '1080', 'mp3', 'm4a', 'webm'];
  if (!validFormats.includes(format)) {
    format = '720';
  }

  const ytdownUrl = `https://app.ytdown.to/en38?url=${encodeURIComponent(rawUrl)}`;

  try {
    const initUrl = `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=${encodeURIComponent(format)}&url=${encodeURIComponent(rawUrl)}`;
    const initRes = await fetch(initUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!initRes.ok) {
      throw new Error(`Upstream returned HTTP ${initRes.status}`);
    }

    const initJson = await initRes.json();
    if (!initJson.success) {
      throw new Error(initJson.text || 'Failed to initialize stream.');
    }

    let downloadUrl = initJson.download_url || initJson.url || null;
    const progressUrl = initJson.progress_url || null;
    const videoTitle = initJson.title || 'YouTube_Download';

    // Poll progress if download_url is not ready yet (poll up to 8 times with 1.2s intervals)
    if (!downloadUrl && progressUrl) {
      const maxRetries = 8;
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((r) => setTimeout(r, 1200));
        try {
          const progRes = await fetch(progressUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(4000),
          });
          if (progRes.ok) {
            const progJson = await progRes.json();
            if (progJson.download_url) {
              downloadUrl = progJson.download_url;
              break;
            }
            if (progJson.text && progJson.text.toLowerCase().includes('error')) {
              break;
            }
          }
        } catch {
          // ignore individual poll network hiccup
        }
      }
    }

    return NextResponse.json({
      success: true,
      title: videoTitle,
      download_url: downloadUrl || null,
      ytdown_url: ytdownUrl,
      format,
      is_direct: !!downloadUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: true,
        download_url: null,
        ytdown_url: ytdownUrl,
        format,
        note: error.message || 'YTDown fallback available.',
        is_direct: false,
      },
      { status: 200 }
    );
  }
}

