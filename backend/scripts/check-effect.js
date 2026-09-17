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
    // Find the verifyReferral useEffect
    const verifyIdx = body.indexOf('verify-code');
    if (verifyIdx !== -1) {
      console.log('=== Verify effect context ===');
      console.log(body.substring(Math.max(0, verifyIdx - 300), verifyIdx + 200));
    }
    
    // Find the useEffect with referralCodeFromUrl dependency
    // Search for the pattern that includes both the API call and the state setter
    const effectMatches = [...body.matchAll(/\.useEffect\(\(\)=>\{[^}]{0,500}verify[^}]{0,500}\},\[/g)];
    effectMatches.forEach((m, i) => {
      console.log(`\n=== useEffect #${i + 1} ===`);
      console.log(m[0].substring(0, 600));
    });
    
    // Look for the specific verify pattern
    const verifyPattern = body.indexOf('referrer_name');
    if (verifyPattern !== -1) {
      console.log('\n=== referrer_name context (broader) ===');
      console.log(body.substring(Math.max(0, verifyPattern - 400), verifyPattern + 200));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
