const https = require('https');
https.get('https://survey-platform-three.vercel.app', res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    // Find all .js files
    const regex = /src="[^"]+\.js"/g;
    const matches = [...data.matchAll(regex)];
    console.log('Script sources found:');
    matches.forEach(m => console.log('  ', m[0]));
    
    // Check for build content
    console.log('Has verify-code:', data.includes('verify-code'));
    console.log('Has verify-referral:', data.includes('verify-referral'));
    console.log('Has invited by:', data.includes('invited by'));
    console.log('HTML length:', data.length);
  });
}).on('error', e => console.error('Error:', e.message));
