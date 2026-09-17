const https = require('https');

const req = https.request({
  hostname: 'survey-platform-three.vercel.app',
  path: '/assets/index.js?t=' + Date.now() + '&nonce=' + Math.random(),
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // AuthRedirect checks: mode === "login" || mode === "register"
    // After our fix, it also checks for ref
    // Search for the pattern: o.get("mode") followed by comparison
    
    // Find the specific AuthRedirect function that returns Navigate
    const navigateToRootIdx = body.indexOf('/');
    // Search for patterns like: !==void 0 && null === i  (Navigate)
    // Actually, let's search for the Navigate component call
    
    // In React Router v6, Navigate is typically rendered as:
    // a.jsx(Navigate,{to:"/",replace:true})
    // or in minified: a.jsx(Na,{to:"/",replace:true})
    
    // Find all occurrences of to:"/" 
    const toRootMatches = [...body.matchAll(/to:["']\/["']/g)];
    console.log('Occurrences of to:"/":', toRootMatches.length);
    toRootMatches.forEach((m, i) => {
      console.log(`\nMatch ${i+1} at position ${m.index}:`);
      console.log(body.substring(Math.max(0, m.index - 200), m.index + 50));
    });
    
    // Also search for the AuthRedirect pattern
    // The function should check mode === login || mode === register || ref
    // In minified code, this would be something like:
    // c==="login"||c==="register"||h  (if c=mode, h=ref)
    
    // Search for "register" near "login" near conditions
    const regLoginIdx = body.indexOf('===\\');
    const contextIdx = body.indexOf('"login"');
    while (contextIdx !== -1) {
      const context = body.substring(Math.max(0, contextIdx - 300), contextIdx + 100);
      if (context.includes('Navigate') || context.includes('replace')) {
        console.log('\n=== AuthRedirect context ===');
        console.log(context);
        break;
      }
      const nextIdx = body.indexOf('"login"', contextIdx + 1);
      if (nextIdx === contextIdx) break;
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
