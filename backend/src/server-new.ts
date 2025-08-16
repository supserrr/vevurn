// backend/src/server.ts
import 'dotenv/config';
import { createAppConfig } from './config/app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

// Initialize Prisma
const prisma = new PrismaClient();

// Create Express app with configuration
const { app, port, host } = createAppConfig();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO for real-time features
const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
  },
});

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join room for real-time updates
  socket.on('join-pos', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined POS room`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available globally for real-time notifications
declare global {
  var socketIO: SocketIOServer;
}
global.socketIO = io;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connections closed');
    
    // Close server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } catch (error: any) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Test database query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database query test successful');

    // Start server
    server.listen(port, host, () => {
      logger.info(`
🚀 Vevurn Backend Server Started!
📍 Environment: ${env.NODE_ENV}
🌐 Server: http://${host}:${port}
💾 Database: Connected (PostgreSQL)
⚡ WebSocket: Enabled
🔒 Security: Helmet enabled
🚨 CORS: ${env.CORS_ORIGINS}
📊 Logging: ${env.LOG_LEVEL}
      `);
    });

  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Add basic API routes before starting server
app.use('/api', (req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0');
  next();
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start the server
startServer();
