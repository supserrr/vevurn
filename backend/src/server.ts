// backend/src/server.ts
import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Prisma
const prisma = new PrismaClient();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO for real-time features
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:3000"],
    credentials: true,
  },
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join room for real-time updates
  socket.on('join-pos', (userId) => {
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
    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Close Socket.IO server
    io.close(() => {
      logger.info('Socket.IO server closed');
    });

    // Disconnect Prisma
    await prisma.$disconnect();
    logger.info('Database connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Database connection check
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    // Check database connection
    await checkDatabaseConnection();

    // Start the server
    server.listen(PORT, () => {
      logger.info(`
🚀 Vevurn POS Server started successfully!
📍 Environment: ${NODE_ENV}
🌐 Server: http://localhost:${PORT}
🔥 API: http://localhost:${PORT}/api
💚 Health: http://localhost:${PORT}/health
🔐 Auth: http://localhost:${PORT}/api/auth
📊 Database: Connected
⚡ Socket.IO: Enabled
      `);

      // Log additional info in development
      if (NODE_ENV === 'development') {
        logger.info(`
📝 Development URLs:
   - API Documentation: http://localhost:${PORT}/api/docs (if implemented)
   - Prisma Studio: Run 'npm run db:studio'
   - Better Auth CLI: Run 'npm run auth:migrate'
        `);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
