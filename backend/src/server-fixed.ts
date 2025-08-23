import { app } from './app';
import { createServer } from 'http';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = createServer(app);
const port = env.PORT || 5000;
const host = env.HOSTNAME || 'localhost';

async function startServer() {
  try {
    server.listen(port, host, () => {
      logger.info(`
🚀 Vevurn POS Backend Server Started
📍 Environment: ${env.NODE_ENV}
🌐 Server: http://${host}:${port}
🔐 Better Auth: http://${host}:${port}/api/auth/*
💾 Database: Connected (PostgreSQL)
📊 Logging: ${env.LOG_LEVEL}
      `);
    });

  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

startServer();
