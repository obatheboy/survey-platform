const https = require('https');

// Bypass cache with random query param
const url = `https://survey-platform-three.vercel.app/assets/index.js?t=${Date.now()}`;
https.get(url, {
  headers: {'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache'}
}, res => {
  console.log('Status:', res.statusCode);
  console.log('X-Vercel-Cache:', res.headers['x-vercel-cache']);
  console.log('ETag:', res.headers['etag']);
  let js = '';
  res.on('data', d => js += d);
  res.on('end', () => {
    console.log('\n=== Frontend Code Verification ===');
    console.log('1. Has verify-code endpoint:', js.includes('verify-code') ? '✅ YES' : '❌ NO');
    console.log('2. Has window.location.search (ref preservation):', js.includes('window.location.search') ? '✅ YES' : '❌ NO');
    console.log('3. Has referrer_name:', js.includes('referrer_name') ? '✅ YES' : '❌ NO');
    console.log('4. Has "invited by":', js.includes('invited by') ? '✅ YES' : '❌ NO');
    console.log('5. Has old verify-referral bug:', js.includes('verify-referral') ? '❌ YES (BUG)' : '✅ NO (fixed)');
    
    // Find the redirect logic
    const locIdx = js.indexOf('window.location.search');
    if (locIdx !== -1) {
      console.log('\n6. Redirect logic:');
      console.log('   ', js.substring(Math.max(0, locIdx-80), locIdx+150));
    }
    
    // Find verify logic
    const verifyIdx = js.indexOf('verify-code');
    if (verifyIdx !== -1) {
      console.log('\n7. Verify logic:');
      console.log('   ', js.substring(Math.max(0, verifyIdx-80), verifyIdx+80));
    }
    
    if (js.includes('verify-code') && js.includes('window.location.search')) {
      console.log('\n✅ CODE IS CORRECTLY DEPLOYED');
      console.log('If user still sees "Invited by Admin", it could be:');
      console.log('   - Browser cache (hard refresh)');
      console.log('   - PWA cached service worker (clear browser data)');
      console.log('   - Using a different deployment URL');
    }
  });
}).on('error', e => console.error('Error:', e.message));
