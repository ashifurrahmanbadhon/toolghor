/**
 * Netlify Serverless Function for Direct YouTube Video & Audio Auto-Download
 * Resolves direct media download stream URLs without ads or redirects.
 */

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const rawUrl = (params.url || '').trim();
  let format = (params.format || '720').toLowerCase().trim();

  if (!rawUrl) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'URL parameter is required.' }),
    };
  }

  // Normalize format
  const validFormats = ['360', '480', '720', '1080', 'mp3', 'm4a', 'webm'];
  if (!validFormats.includes(format)) {
    format = '720';
  }

  try {
    const initUrl = `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=${encodeURIComponent(format)}&url=${encodeURIComponent(rawUrl)}`;
    const initRes = await fetch(initUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
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

    // Poll progress if download_url is not ready yet
    if (!downloadUrl && progressUrl) {
      const maxRetries = 15;
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          const pRes = await fetch(progressUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/json',
            },
          });
          if (pRes.ok) {
            const pJson = await pRes.json();
            if (pJson.download_url) {
              downloadUrl = pJson.download_url;
              break;
            }
          }
        } catch (pollErr) {
          console.warn('[YT Poll Error]', pollErr);
        }
      }
    }

    if (!downloadUrl) {
      return {
        statusCode: 504,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Download generation timed out. Please try again or use alternative server.',
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        download_url: downloadUrl,
        title: videoTitle,
        format: format,
      }),
    };
  } catch (err) {
    console.error('[YT Download Function Error]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err.message || 'Unable to resolve YouTube download stream.',
      }),
    };
  }
};
