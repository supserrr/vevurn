const http = require('http');

// Simple HTTP server 
const server = http.createServer((req: any, res: any) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      message: 'Server is running successfully!'
    }));
    return;
  }

  if (req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Backend API is running!',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version
    }));
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', availableEndpoints: ['/health', '/api/test'] }));
});

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`� Node version: ${process.version}`);
  console.log(`�🔧 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`⚡ Server ready to handle requests!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
    process.exit(0);
  });
});

module.exports = server;
