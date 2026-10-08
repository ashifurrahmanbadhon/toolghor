/**
 * Netlify Serverless Function for ConvertAPI PDF -> DOCX
 * Protects CONVERTAPI_TOKEN securely on Netlify server side.
 */

exports.handler = async function (event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const token = (process.env.CONVERTAPI_TOKEN || '').trim();
  if (!token || token === 'your_token_here') {
    console.error('[Netlify ConvertAPI] CONVERTAPI_TOKEN is not configured in Netlify environment variables');
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
      }),
    };
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Expected multipart/form-data' }),
      };
    }

    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'utf-8');

    if (bodyBuffer.length > 50 * 1024 * 1024) {
      return {
        statusCode: 413,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'File size exceeds the allowed limit (50MB). Please try a smaller PDF.'
        }),
      };
    }

    // Call ConvertAPI
    const res = await fetch('https://v2.convertapi.com/convert/pdf/to/docx', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: bodyBuffer,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[ConvertAPI Error] HTTP ${res.status}: ${errText}`);
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
        }),
      };
    }

    const data = await res.json();
    const files = data.Files || [];
    if (!files.length) {
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
        }),
      };
    }

    const first = files[0];
    let docxBuffer = null;

    if (first.FileData) {
      docxBuffer = Buffer.from(first.FileData, 'base64');
    } else if (first.Url) {
      const dl = await fetch(first.Url);
      docxBuffer = Buffer.from(await dl.arrayBuffer());
    }

    if (!docxBuffer) {
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
        }),
      };
    }

    const outName = first.FileName || 'document.docx';

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${outName}"`,
        'X-Converted-By': 'ConvertAPI',
      },
      isBase64Encoded: true,
      body: docxBuffer.toString('base64'),
    };
  } catch (err) {
    console.error('[Netlify Function Error]', err);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
      }),
    };
  }
};
