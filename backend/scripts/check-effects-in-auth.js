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
    // Find the Auth component (Hj) and extract all useEffect calls within it
    const hjIdx = body.indexOf('function Hj');
    if (hjIdx !== -1) {
      // Get a large chunk of the Hj function
      const hjCode = body.substring(hjIdx, hjIdx + 3000);
      
      // Find all useEffect calls
      const effectRegex = /g\.useEffect\(\(\)=>\{([^}]+(?:\{[^{}]*\}[^}]*)*)\},\[([^\]]*)\]/g;
      let match;
      let count = 0;
      while ((match = effectRegex.exec(hjCode)) !== null) {
        count++;
        console.log(`\n=== useEffect #${count} (deps: ${match[2]}) ===`);
        // Extract key parts: look for navigate, api.post, api.get
        const effectBody = match[1];
        if (effectBody.includes('navigate') || effectBody.includes('i(')) {
          console.log('  Contains navigate call');
        }
        if (effectBody.includes('verify-code')) {
          console.log('  Contains verify-code call');
        }
        if (effectBody.includes('/health')) {
          console.log('  Contains health check');
        }
        // Print a snippet
        console.log('  Body snippet:', effectBody.substring(0, 150));
      }
      
      // Also search for any navigate calls within Hj
      const navigateMatches = [...hjCode.matchAll(/\bi\([^)]{0,60}\/auth[^)]*\)/g)];
      console.log('\n=== Navigate calls to /auth: ===');
      navigateMatches.forEach((m, i) => {
        console.log(`${i+1}:`, m[0]);
      });
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
