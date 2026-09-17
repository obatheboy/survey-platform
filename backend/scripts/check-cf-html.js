const https = require('https');

https.get('https://survey-platform.pages.dev', res => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log('HTML length:', html.length);
    // Find all script references
    const scripts = html.match(/src=["'][^"']+["']/g) || [];
    console.log('Scripts found:', scripts);
    
    // Also check for any reference to vite or assets
    const assets = html.match(/assets\/[^"']+/g) || [];
    console.log('Assets:', assets);
  });
}).on('error', e => console.error('Error:', e.message));
