const https = require('https');
const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js',
  method: 'GET',
  headers: {'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Find the verify-code context in deployed code
    const verifyIdx = body.indexOf('verify-code');
    if (verifyIdx !== -1) {
      console.log('Context around "verify-code":');
      console.log(body.substring(Math.max(0, verifyIdx-100), verifyIdx+100));
    }
    
    // Check if the referrer_name is used correctly
    const refNameIdx = body.indexOf('referrer_name');
    if (refNameIdx !== -1) {
      console.log('\nContext around "referrer_name":');
      console.log(body.substring(Math.max(0, refNameIdx-100), refNameIdx+100));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
