import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const BASE_URL = 'https://jsearch.p.rapidapi.com';
const PORT = 3001;

if (!RAPIDAPI_KEY) {
  console.error('Error: RAPIDAPI_KEY not set in .env file');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!req.url?.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Strip /api prefix and proxy to JSearch
  const apiPath = req.url.replace(/^\/api/, '');
  const targetUrl = `${BASE_URL}${apiPath}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    const data = await response.text();

    // Forward rate limit headers
    const remaining = response.headers.get('x-ratelimit-requests-remaining');
    if (remaining) {
      res.setHeader('X-RateLimit-Remaining', remaining);
    }

    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    res.end(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Proxy error',
      })
    );
  }
});

server.listen(PORT, () => {
  console.log(`API proxy server running on http://localhost:${PORT}`);
});
