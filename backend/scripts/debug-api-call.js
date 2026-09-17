const https = require('https');

// Test from the Vercel origin specifically
const origin = 'https://survey-platform-three.vercel.app';
const data = JSON.stringify({referral_code: '2EV96QPB'});

const req = https.request({
  hostname: 'survey-platform-api.onrender.com',
  path: '/api/affiliate/verify-code',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Origin': 'https://survey-platform-three.vercel.app',
    'Referer': 'https://survey-platform-three.vercel.app/auth?ref=2EV96QPB',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('CORS-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('CORS-Allow-Credentials:', res.headers['access-control-allow-credentials']);
  console.log('Vary:', res.headers['vary']);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Body:', body);
    
    // Check if the issue is with the axios API client configuration
    console.log('\n=== Checking api.js configuration ===');
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();

// Also test with a preflight OPTIONS request
const optionsReq = https.request({
  hostname: 'survey-platform-api.onrender.com',
  path: '/api/affiliate/verify-code',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://survey-platform-three.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
}, res => {
  console.log('\n=== OPTIONS preflight ===');
  console.log('Status:', res.statusCode);
  console.log('CORS-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('CORS-Allow-Methods:', res.headers['access-control-allow-methods']);
  console.log('CORS-Allow-Headers:', res.headers['access-control-allow-headers']);
});
optionsReq.on('error', e => console.error('Error:', e.message));
optionsReq.end();
