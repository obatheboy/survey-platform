const https = require('https');

// Simulate browser request to the auth page with ref parameter
const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/auth?ref=2EV96QPB',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('Location:', res.headers['location'] || 'No redirect');
  console.log('Content-Type:', res.headers['content-type']);
  
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Check for redirect (301/302)
    if (res.statusCode >= 300 && res.statusCode < 400) {
      console.log('\n❌ REDIRECT detected - ref parameter is being stripped!');
    } else {
      console.log('\n✅ No redirect - page served directly');
    }
    
    // Check for index.html
    if (body.includes('Survey') && body.includes('Register')) {
      console.log('✅ Auth page HTML served');
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
