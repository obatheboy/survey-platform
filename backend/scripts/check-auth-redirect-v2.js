const https = require('https');

const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js?t=' + Date.now() + '&nonce=' + Math.random(),
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('ETag:', res.headers['etag']);
  console.log('Last-Modified:', res.headers['last-modified']);
  console.log('X-Vercel-Cache:', res.headers['x-vercel-cache']);
  
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Search for the mode check pattern - look for "login" and "register" in close proximity
    // The original code checks: mode === "login" || mode === "register"
    // After our fix, it should also check for ref
    
    // Search for the pattern that contains both login and register
    const loginIdx = body.indexOf('"login"');
    const registerIdx = body.indexOf('"register"');
    
    if (loginIdx !== -1 && registerIdx !== -1) {
      const minIdx = Math.min(loginIdx, registerIdx);
      const maxIdx = Math.max(loginIdx, registerIdx);
      if (maxIdx - minIdx < 500) { // They should be close together
        console.log('\n=== Mode check context ===');
        console.log(body.substring(Math.max(0, minIdx - 100), maxIdx + 100));
      }
    }
    
    // Also check all occurrences of "login" to find the AuthRedirect
    let idx = 0;
    const occurrences = [];
    while ((idx = body.indexOf('login', idx)) !== -1) {
      occurrences.push({
        position: idx,
        context: body.substring(Math.max(0, idx - 50), idx + 80)
      });
      idx += 5;
      if (occurrences.length > 20) break;
    }
    
    console.log('\n=== All "login" occurrences ===');
    occurrences.forEach((o, i) => {
      console.log(`${i + 1}: ...${o.context}...`);
    });
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
