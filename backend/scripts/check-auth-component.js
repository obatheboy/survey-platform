const https = require('https');
const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js?t=' + Date.now(),
  method: 'GET',
  headers: {'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'}
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Find the Auth component section
    // Look for "Survey" and "Kenya" text to locate the Auth component
    const authIdx = body.indexOf('Kenya');
    if (authIdx !== -1) {
      console.log('=== Auth component context ===');
      console.log(body.substring(Math.max(0, authIdx - 2000), authIdx + 500));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
