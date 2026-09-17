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
    // Find the render logic for the banner
    // Look for the pattern that renders the referrer banner or admin banner
    
    // The key code should be: inviterInfo && (render green banner)
    // Then: !inviterInfo && referralCodeFromUrl && (render yellow admin banner)
    // Then: !inviterInfo && !referralCodeFromUrl && (render yellow admin banner)
    
    // Let's search for the condition that triggers the admin banner
    // In minified code, this would be something like: !S&&f && ... && "Admin"
    
    // Search for "Admin" in the auth-related code
    const adminMatches = [];
    let idx = 0;
    while ((idx = body.indexOf('Admin', idx)) !== -1) {
      adminMatches.push({
        position: idx,
        context: body.substring(Math.max(0, idx - 200), idx + 50)
      });
      idx += 5;
    }
    
    console.log('Found "Admin" at positions:', adminMatches.map(m => m.position));
    adminMatches.forEach((m, i) => {
      console.log(`\n--- Match ${i + 1} at position ${m.position} ---`);
      console.log(m.context);
    });
    
    // Find the full context of the conditional rendering
    // Look for where the referrer banner is rendered
    const referrerIdx = body.indexOf('You were invited by');
    if (referrerIdx !== -1) {
      console.log('\n=== Full context around "You were invited by" ===');
      console.log(body.substring(Math.max(0, referrerIdx - 500), referrerIdx + 500));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
