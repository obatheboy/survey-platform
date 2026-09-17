const https = require('https');

// Test if the API is rate limiting
async function testRateLimit() {
  const results = [];
  for (let i = 0; i < 5; i++) {
    const data = JSON.stringify({referral_code: '2EV96QPB'});
    const req = https.request({
      hostname: 'survey-platform-api.onrender.com',
      path: '/api/affiliate/verify-code?_v=2.0.0',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Origin': 'https://survey-platform-three.vercel.app',
        'Referer': 'https://survey-platform-three.vercel.app/auth?ref=2EV96QPB',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      results.push({attempt: i+1, status: res.statusCode});
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        results[results.length-1].body = body;
        if (results.length === 5) {
          results.forEach(r => console.log(`Attempt ${r.attempt}: ${r.status} - ${r.body}`));
        }
      });
    });
    req.on('error', e => results.push({attempt: i+1, error: e.message}));
    req.write(data);
    req.end();
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 100));
  }
}

testRateLimit();
