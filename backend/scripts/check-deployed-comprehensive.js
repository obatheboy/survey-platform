const https = require('https');

// Test 1: Verify the deployed backend endpoint
const data = JSON.stringify({referral_code: '2EV96QPB'});
const req = https.request({
  hostname: 'survey-platform-api.onrender.com',
  path: '/api/affiliate/verify-code',
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'Content-Length': data.length}
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Backend verify-code response:', res.statusCode, body);
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();

// Test 2: Check what the deployed frontend JS contains
const req2 = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js',
  method: 'GET',
  headers: {'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Check for the Admin text in different forms
    console.log('\nFrontend JS analysis:');
    console.log('invited by (lowercase):', body.includes('invited by'));
    console.log('Invited by (case-sensitive):', body.includes('Invited by'));
    console.log('Admin (exact):', body.includes('Admin'));
    // The minified version might have it differently
    const adminIdx = body.indexOf('Admin');
    if (adminIdx !== -1) {
      console.log('Context around Admin:', body.substring(Math.max(0, adminIdx-30), adminIdx+30));
    }
  });
});
req2.on('error', e => console.error('Error:', e.message));
req2.end();
