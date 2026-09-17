const https = require('https');

const path = '/assets/index.js?cb=' + Date.now() + '&_=' + Math.random();
const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: path,
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('X-Vercel-Cache:', res.headers['x-vercel-cache']);
  console.log('Cache-Control:', res.headers['cache-control']);
  console.log('ETag:', res.headers['etag']);
  
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Content size:', body.length);
    console.log('Has window.location.search:', body.includes('window.location.search') ? '✅ YES' : '❌ NO');
    console.log('Has verify-code:', body.includes('verify-code') ? '✅ YES' : '❌ NO');
    console.log('Has referrer_name:', body.includes('referrer_name') ? '✅ YES' : '❌ NO');
    
    // Check for "Invited by Admin" in the context of conditional rendering
    const adminIdx = body.indexOf('Admin');
    console.log('Has Admin in code:', adminIdx !== -1 ? 'YES' : 'NO');
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
