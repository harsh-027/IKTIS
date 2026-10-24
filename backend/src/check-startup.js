import app from './server.js';
import http from 'http';

const testPort = 5099;
const server = app.listen(testPort, () => {
  console.log(`[Startup Check] Backend started successfully on port ${testPort}`);

  http.get(`http://localhost:${testPort}/api/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[Startup Check] GET /api/health returned HTTP ${res.statusCode}: ${data}`);
      server.close(() => {
        console.log('[Startup Check] Server closed cleanly. Startup verified.');
        process.exit(0);
      });
    });
  }).on('error', (err) => {
    console.error('[Startup Check] Health check request failed:', err.message);
    server.close(() => process.exit(1));
  });
});
