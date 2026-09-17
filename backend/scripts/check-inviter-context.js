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
    // Search for 'invited by' context
    const invitedIdx = body.indexOf('invited by');
    console.log('Context around "invited by":');
    console.log(body.substring(Math.max(0, invitedIdx-100), invitedIdx+300));
    
    // Search for the condition !inviterInfo && referralCodeFromUrl
    const refUrlIdx = body.indexOf('!S&&f');
    if (refUrlIdx !== -1) {
      console.log('\nContext around !S&&f (referralCodeFromUrl condition):');
      console.log(body.substring(Math.max(0, refUrlIdx-50), refUrlIdx+200));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
