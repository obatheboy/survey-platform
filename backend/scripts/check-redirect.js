const https = require('https');

// Check the actual deployed code for the redirect logic
const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js?t=' + Date.now() + '&v=' + Math.random(),
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
    // Find the redirect effect - look for the pattern that creates the URL
    const redirectIdx = body.indexOf('window.location.search');
    if (redirectIdx !== -1) {
      // Find the second occurrence (should be the redirect effect)
      const secondIdx = body.indexOf('window.location.search', redirectIdx + 1);
      const idx = secondIdx !== -1 ? secondIdx : redirectIdx;
      
      console.log('\n=== Redirect/Verify logic found ===');
      console.log(body.substring(Math.max(0, idx - 200), idx + 500));
    }
    
    // Specifically look for the ref parameter handling
    const refParamIdx = body.indexOf('ref=${');
    if (refParamIdx !== -1) {
      console.log('\n=== ref parameter handling ===');
      console.log(body.substring(Math.max(0, refParamIdx - 100), refParamIdx + 200));
    } else {
      console.log('\n❌ No ref parameter preservation found in redirect!');
      // Search for old redirect pattern (without ref)
      const oldPattern = body.indexOf('mode=${');
      if (oldPattern !== -1) {
        console.log('Found old redirect pattern:');
        console.log(body.substring(Math.max(0, oldPattern - 100), oldPattern + 200));
      }
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
