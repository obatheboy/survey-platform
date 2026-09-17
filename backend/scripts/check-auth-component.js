const https = require('https');

const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js?t=' + Date.now() + '&nonce=' + Math.random(),
  method: 'GET',
  headers: {'Cache-Control': 'no-cache'}
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Find the Hj function (Auth component)
    const hjIdx = body.indexOf('function Hj');
    if (hjIdx !== -1) {
      console.log('=== Auth component (Hj) start ===');
      console.log(body.substring(hjIdx, hjIdx + 1000));
    }
    
    // Find the verify effect within Auth
    const verifyIdx = body.indexOf('referrer_name');
    if (verifyIdx !== -1) {
      // Look backwards to find the verify effect
      console.log('\n=== Verify effect ===');
      console.log(body.substring(Math.max(0, verifyIdx - 500), verifyIdx + 200));
    }
    
    // Find the redirect/navigate in Auth
    const navigateIdx = body.indexOf('/auth?mode');
    if (navigateIdx !== -1) {
      console.log('\n=== Redirect in Auth ===');
      console.log(body.substring(Math.max(0, navigateIdx - 100), navigateIdx + 200));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
