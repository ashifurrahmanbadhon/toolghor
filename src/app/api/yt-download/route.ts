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

  try {
    const initUrl = `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=${encodeURIComponent(format)}&url=${encodeURIComponent(rawUrl)}`;
    const initRes = await fetch(initUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    if (!initRes.ok) {
      throw new Error(`Upstream server returned HTTP ${initRes.status}`);
    }

    const initJson = await initRes.json();
    if (!initJson.success) {
      throw new Error(initJson.text || 'Failed to initialize download stream.');
    }

    let downloadUrl = initJson.download_url || initJson.url || null;
    const progressUrl = initJson.progress_url || null;
    const videoTitle = initJson.title || 'YouTube_Download';

    const ytdownUrl = `https://app.ytdown.to/en38?url=${encodeURIComponent(rawUrl)}`;

    // Poll progress if download_url is not ready yet (limit to fast 4 retries)
    if (!downloadUrl && progressUrl) {
      const maxRetries = 4;
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const progRes = await fetch(progressUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
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
      }
    }

    return NextResponse.json({
      success: true,
      title: videoTitle,
      download_url: downloadUrl || ytdownUrl,
      ytdown_url: ytdownUrl,
      format,
    });
  } catch (error: any) {
    const fallbackYtDown = `https://app.ytdown.to/en38?url=${encodeURIComponent(rawUrl)}`;
    return NextResponse.json(
      {
        success: true,
        download_url: fallbackYtDown,
        ytdown_url: fallbackYtDown,
        format,
        note: error.message || 'Stream resolved via YTDown portal.',
      },
      { status: 200 }
    );
  }
}
