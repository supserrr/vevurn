// Ultra-simple Node.js server - no TypeScript issues
var http = require('http');

// Create HTTP server
var server = http.createServer(function(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"status":"ok","message":"Server running","timestamp":"' + new Date().toISOString() + '"}');
    return;
  }

  // Test endpoint
  if (req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"message":"API working!","timestamp":"' + new Date().toISOString() + '"}');
    return;
  }

  // Root endpoint
  if (req.url === '/' || req.url === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"message":"Vevurn Backend API","status":"running","endpoints":["/health","/api/test"]}');
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end('{"error":"Not found"}');
});

// Start server
var PORT = parseInt(process.env.PORT || '3001', 10);
var HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, function() {
  console.log('=== VEVURN BACKEND SERVER ===');
  console.log('Server: http://' + HOST + ':' + PORT);
  console.log('Health: http://' + HOST + ':' + PORT + '/health');
  console.log('Test API: http://' + HOST + ':' + PORT + '/api/test');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Server ready!');
});

// Export
module.exports = server;
