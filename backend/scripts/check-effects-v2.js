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
    // Find the verifyReferral and redirect useEffect logic
    // Search for the verify-code usage with state setter C
    const pattern = 'verify-code';
    const idx = body.indexOf(pattern);
    if (idx !== -1) {
      console.log('=== Full verify effect ===');
      console.log(body.substring(Math.max(0, idx - 500), idx + 300));
    }
    
    // Also find the redirect useEffect
    const redirectIdx = body.indexOf('window.location.search');
    if (redirectIdx !== -1) {
      console.log('\n=== Redirect effect ===');
      console.log(body.substring(Math.max(0, redirectIdx - 100), redirectIdx + 300));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
