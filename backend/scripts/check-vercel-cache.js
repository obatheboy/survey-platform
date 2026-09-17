const https = require('https');

// Force cache bypass with unique query params
const urls = [
  'https://survey-platform-three.vercel.app/assets/index.js',
  'https://survey-platform-three.vercel.app/_next/static/chunks/pages/auth.js',
];

const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/api/_log?cachebust=' + Date.now(),
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('X-Vercel-Cache:', res.headers['x-vercel-cache']);
  console.log('CDN-Cache:', res.headers['cdn-cache']);
  
  // Check headers for cache control
  Object.keys(res.headers).forEach(h => {
    if (h.includes('cache') || h.includes('vercel') || h.includes('etag')) {
      console.log(h + ':', res.headers[h]);
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
