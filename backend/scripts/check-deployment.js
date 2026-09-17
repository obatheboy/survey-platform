const https = require('https');

// Check deployed frontend for the ref= preservation
const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js',
  method: 'GET',
  headers: {'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}
}, res => {
  console.log('Status:', res.statusCode);
  console.log('ETag:', res.headers['etag']);
  console.log('X-Vercel-Cache:', res.headers['x-vercel-cache']);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Find the redirect logic
    const redirectIdx = body.indexOf('navigate(');
    if (redirectIdx !== -1) {
      console.log('Redirect logic context:');
      console.log(body.substring(Math.max(0, redirectIdx-100), redirectIdx+200));
    }
    
    // Check if ref is preserved in the redirect
    const modeRedirectIdx = body.indexOf("mode=");
    if (modeRedirectIdx !== -1) {
      console.log('\nMode redirect context:');
      console.log(body.substring(Math.max(0, modeRedirectIdx-100), modeRedirectIdx+200));
    }
    
    // Check for our window.location.search logic
    console.log('\nHas window.location.search:', body.includes('window.location.search'));
    console.log('Has ref= in navigate:', body.includes('ref='));
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
