/**
 * Vercel / Node.js Serverless Function for ConvertAPI PDF -> DOCX
 * Protects CONVERTAPI_TOKEN on server side.
 */

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (process.env.CONVERTAPI_TOKEN || '').trim();
  if (!token || token === 'your_token_here' || token === 'your_convertapi_token_here') {
    console.error('[ConvertAPI Error] CONVERTAPI_TOKEN is not configured in server environment');
    return res.status(500).json({
      error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
    });
  }

  try {
    // Read raw request stream
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length > 50 * 1024 * 1024) {
      return res.status(413).json({
        error: 'File size exceeds the allowed limit (50MB). Please try a smaller PDF.'
      });
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    // Forward multipart form data directly to ConvertAPI with Bearer token
    const convertApiResponse = await fetch('https://v2.convertapi.com/convert/pdf/to/docx', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: buffer,
    });

    if (!convertApiResponse.ok) {
      const errText = await convertApiResponse.text();
      console.error(`[ConvertAPI Error] Status ${convertApiResponse.status}: ${errText}`);
      return res.status(500).json({
        error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
      });
    }

    const json = await convertApiResponse.json();
    const files = json.Files || [];
    if (!files.length) {
      return res.status(500).json({
        error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
      });
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
      return res.status(500).json({
        error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
      });
    }

    const outName = first.FileName || 'converted.docx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${outName}"`);
    res.setHeader('Content-Length', docxBuffer.length);
    res.setHeader('X-Converted-By', 'ConvertAPI');
    return res.status(200).send(docxBuffer);
  } catch (err) {
    console.error('[Server Error]', err);
    return res.status(500).json({
      error: 'Your PDF could not be converted at the moment. Please try again with another PDF.'
    });
  }
}
