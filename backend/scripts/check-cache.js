const https = require('https');
const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('ETag:', res.headers['etag']);
  console.log('X-Vercel-Cache:', res.headers['x-vercel-cache']);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Content length:', body.length);
    console.log('Has verify-code:', body.includes('verify-code'));
    console.log('Has invited by:', body.includes('invited by'));
    console.log('Has inviterBanner:', body.includes('inviterBanner'));
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
