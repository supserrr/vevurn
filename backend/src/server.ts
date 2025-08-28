import { app } from './app';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { NotificationService } from './services/notification.service';

const server = createServer(app);
const port = env.PORT || 8000;
const host = env.HOSTNAME || 'localhost';

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGINS?.split(',') || ["http://localhost:3000"],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info('Client connected to Socket.io', { socketId: socket.id });

  // Join user-specific room for targeted notifications
  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info('Socket joined room', { socketId: socket.id, room });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected from Socket.io', { socketId: socket.id });
  });
});

// Initialize notification service with Socket.io
NotificationService.initialize(io);

async function startServer() {
  try {
    // Try to connect to database (non-blocking)
    const dbConnected = await connectDatabase();
    
    server.listen(port, host, () => {
      logger.info(`
🚀 Vevurn POS Backend Server Started
📍 Environment: ${env.NODE_ENV}
🌐 Server: http://${host}:${port}
🔐 Better Auth: http://${host}:${port}/api/auth/*
💾 Database: ${dbConnected ? 'Connected (PostgreSQL)' : 'Not Connected'}
🔔 Socket.io: Enabled for real-time notifications
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
