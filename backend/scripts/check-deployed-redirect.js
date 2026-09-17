const https = require('https');

const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js',
  method: 'GET',
  headers: {'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Search for the navigate with mode and ref
    const matches = [...body.matchAll(/navigate\([^)]{0,80}mode[^)]{0,80}\)/g)];
    matches.forEach((m, i) => {
      console.log(`Navigate call ${i + 1}:`, m[0].substring(0, 100));
    });
    
    // Also search for the window.location pattern
    const locIdx = body.indexOf('window.location.search');
    if (locIdx !== -1) {
      console.log('\nWindow location context:');
      console.log(body.substring(Math.max(0, locIdx-200), locIdx+200));
    }
    
    // Search for ref preservation
    const refIdx = body.indexOf('ref=');
    if (refIdx !== -1) {
      console.log('\nRef= context:');
      console.log(body.substring(Math.max(0, refIdx-200), refIdx+100));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
