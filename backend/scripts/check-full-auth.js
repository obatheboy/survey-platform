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
    // Find the Auth component (Hj) and dump a chunk of it
    const hjIdx = body.indexOf('function Hj');
    // Also find the end - look for the next function definition
    const nextFuncIdx = body.indexOf('function ', hjIdx + 10);
    
    console.log('Auth component starts at:', hjIdx);
    console.log('Next function starts at:', nextFuncIdx);
    console.log('Auth component length:', nextFuncIdx - hjIdx);
    
    const hjCode = body.substring(hjIdx, nextFuncIdx);
    
    // Find all useEffect usages
    let lastIdx = 0;
    let effectNum = 0;
    while (true) {
      const effectIdx = hjCode.indexOf('useEffect', lastIdx);
      if (effectIdx === -1) break;
      effectNum++;
      // Find the dependency array (after the effect body)
      const depsStart = hjCode.indexOf('[', effectIdx);
      if (depsStart !== -1 && depsStart < effectIdx + 3000) {
        const depsEnd = hjCode.indexOf(']', depsStart);
        const deps = hjCode.substring(depsStart, depsEnd + 1);
        console.log(`\n--- useEffect #${effectNum} deps: ${deps} ---`);
        // Print context around the useEffect
        console.log(hjCode.substring(effectIdx, effectIdx + 400));
      }
      lastIdx = effectIdx + 10;
    }
    
    // Search for 'navigate' within Auth component
    const navigateIdx = hjCode.indexOf('i(`/auth');
    if (navigateIdx !== -1) {
      console.log('\n=== Found navigate to /auth in Auth component ===');
      console.log(hjCode.substring(Math.max(0, navigateIdx - 100), navigateIdx + 200));
    } else {
      console.log('\n=== No navigate to /auth found in Auth component ===');
    }
    
    // Search for 'Navigate' in AuthRedirect (W2)
    const w2Idx = body.indexOf('function W2');
    if (w2Idx !== -1) {
      console.log('\n=== AuthRedirect (W2) ===');
      console.log(body.substring(w2Idx, w2Idx + 500));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
