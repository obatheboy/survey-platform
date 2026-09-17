const https = require('https');

console.log('=== Testing Referral Flow ===\n');

// Test 1: Fetch the auth page HTML with ref parameter
console.log('1. Fetching auth page HTML...');
https.get('https://survey-platform-three.vercel.app/auth?ref=2EV96QPB', res => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log('   Status:', res.statusCode);
    console.log('   Has ref= in HTML:', html.includes('2EV96QPB') ? 'YES' : 'NO');
    console.log('   HTML length:', html.length);
    
    // Test 2: Check if the JS bundle has the correct verify endpoint
    console.log('\n2. Checking JS bundle for verify-code...');
    const jsMatch = html.match(/src="([^"]+\.js)"/);
    if (jsMatch) {
      const jsUrl = jsMatch[1];
      console.log('   JS file:', jsUrl);
      
      https.get('https://survey-platform-three.vercel.app' + jsUrl, jsRes => {
        let js = '';
        jsRes.on('data', d => js += d);
        jsRes.on('end', () => {
          console.log('   JS size:', js.length);
          console.log('   Has verify-code:', js.includes('verify-code') ? 'YES' : 'NO');
          console.log('   Has referrer_name:', js.includes('referrer_name') ? 'YES' : 'NO');
          console.log('   Has window.location.search:', js.includes('window.location.search') ? 'YES' : 'NO');
          
          // Test 3: Verify the backend API directly
          console.log('\n3. Testing backend verify-code API...');
          const postData = JSON.stringify({referral_code: '2EV96QPB'});
          const apiReq = https.request({
            hostname: 'survey-platform-api.onrender.com',
            path: '/api/affiliate/verify-code',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': postData.length,
              'Origin': 'https://survey-platform-three.vercel.app',
              'Referer': 'https://survey-platform-three.vercel.app/auth?ref=2EV96QPB'
            }
          }, apiRes => {
            let apiBody = '';
            apiRes.on('data', d => apiBody += d);
            apiRes.on('end', () => {
              console.log('   Status:', apiRes.statusCode);
              console.log('   CORS-Allow-Origin:', apiRes.headers['access-control-allow-origin']);
              console.log('   Response:', apiBody);
              
              // Determine result
              const result = JSON.parse(apiBody);
              if (result.valid && result.referrer_name) {
                console.log('\n   ✅ REFERRAL IS VERIFIED!');
                console.log('   Expected banner: "🎉 You were invited by Gsgsg"');
              } else {
                console.log('\n   ❌ Referral verification failed');
              }
            });
          });
          apiReq.on('error', e => console.error('   Error:', e.message));
          apiReq.write(postData);
          apiReq.end();
        });
      }).on('error', e => console.error('   JS Error:', e.message));
    }
  });
}).on('error', e => console.error('   HTML Error:', e.message));
