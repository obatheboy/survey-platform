const https = require('https');

console.log('=== Checking Cloudflare Pages deployment ===\n');

// Check Cloudflare Pages deployment
https.get('https://survey-platform.pages.dev/auth?ref=2EV96QPB', res => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('CF-RAY:', res.headers['cf-ray'] || 'N/A');
    console.log('Server:', res.headers['server'] || 'N/A');
    
    const jsMatch = html.match(/src="([^"]+\.js)"/);
    if (jsMatch) {
      const jsUrl = jsMatch[1];
      console.log('JS file:', jsUrl);
      
      https.get('https://survey-platform.pages.dev' + jsUrl, jsRes => {
        let js = '';
        jsRes.on('data', d => js += d);
        jsRes.on('end', () => {
          console.log('JS size:', js.length);
          console.log('Has verify-code:', js.includes('verify-code') ? 'YES' : 'NO');
          console.log('Has verify-referral (OLD):', js.includes('verify-referral') ? 'YES (BUG)' : 'NO');
          console.log('Has window.location.search:', js.includes('window.location.search') ? 'YES' : 'NO');
          console.log('Has referrer_name:', js.includes('referrer_name') ? 'YES' : 'NO');
          console.log('Has invited by:', js.includes('invited by') ? 'YES' : 'NO');
        });
      }).on('error', e => console.error('Error:', e.message));
    }
  });
}).on('error', e => console.error('Error:', e.message));
