const https = require('https');
const options = {
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js',
  method: 'GET',
  headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('Content length:', data.length);
    console.log('Has verify-code:', data.includes('verify-code'));
    console.log('Has verify-referral:', data.includes('verify-referral'));
    console.log('Has invited by:', data.includes('invited by'));
    console.log('Has invited by Admin:', data.includes('Invited by Admin'));
    console.log('Has referrer_name:', data.includes('referrer_name'));
    // Find context around 'invited' or 'referred'
    const idx = data.indexOf('invited') !== -1 ? data.indexOf('invited') : data.indexOf('referred');
    if (idx !== -1) {
      console.log('Context around match:', data.substring(Math.max(0, idx-50), idx+100));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
