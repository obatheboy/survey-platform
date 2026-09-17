const https = require('https');

const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js?t=' + Date.now(),
  method: 'GET',
  headers: {'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}
}, res => {
  console.log('Status:', res.statusCode);
  console.log('ETag:', res.headers['etag']);
  
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // Look for the AuthRedirect logic
    // In minified code, this will be something like:
    // mode==="login"||mode==="register"||ref
    // or similar
    
    // Search for patterns related to AuthRedirect
    const authRedirectIdx = body.indexOf('login');
    const registerIdx = body.indexOf('register');
    
    // Actually let's search for the specific pattern
    // The minified code should contain "login" and "register" near a conditional
    // followed by Navigate (which would be something like i("/"))
    
    // Check if the code has the ref check in the redirect condition
    // Search for a pattern that looks like checking for ref alongside login/register
    const refCheckIdx = body.indexOf('s.get("ref")');
    console.log('Has ref check in redirect:', refCheckIdx !== -1 ? '✅ YES' : '❌ NO');
    
    if (refCheckIdx !== -1) {
      console.log('\nContext around ref check:');
      console.log(body.substring(Math.max(0, refCheckIdx - 200), refCheckIdx + 200));
    }
    
    // Also check for "Navigate" to "/" pattern (the redirect to home)
    const navigateHomeIdx = body.indexOf('i("/")');
    if (navigateHomeIdx !== -1) {
      console.log('\nContext around Navigate to home:');
      console.log(body.substring(Math.max(0, navigateHomeIdx - 200), navigateHomeIdx + 100));
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
