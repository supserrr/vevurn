import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import middleware and routes
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { setupErrorTracking } from './middleware/errorTracking';

// Import route handlers
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import saleRoutes from './routes/sales';
import customerRoutes from './routes/customers';
import supplierRoutes from './routes/suppliers';
import loanRoutes from './routes/loans';
import reportRoutes from './routes/reports';
import settingRoutes from './routes/settings';
import pricingRoutes from './routes/pricing.routes';
import jwtTestRoutes from './routes/jwt-test';
import simpleJwtTestRoutes from './routes/simple-jwt-test';
import enhancedAuthRoutes from './routes/enhancedAuth';
import databaseMonitoringRoutes from './routes/database-monitoring';
import errorTrackingRoutes from './routes/error-tracking';

// Import Better Auth with proper Express integration
import { auth } from './lib/index.js';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';

// Import services
import { DatabaseService } from './services/DatabaseService';
import { DatabasePoolService } from './services/DatabasePoolService';
import { RedisService } from './services/RedisService';
import { WebSocketService } from './services/WebSocketService';
import { ErrorTrackingService } from './services/ErrorTrackingService';
import { logger } from './utils/logger';

// Create Express app
const app = express();
const server = createServer(app);

// Initialize services
const databaseService = new DatabaseService();
const databasePoolService = DatabasePoolService.getInstance();
const redisService = new RedisService();
const errorTracker = ErrorTrackingService.getInstance();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});
const webSocketService = new WebSocketService(io);
logger.info('Services initialized: Database, Redis, Error Tracking, WebSocket');

// Make webSocketService and redisService available globally for route handlers
(global as any).webSocketService = webSocketService;
(global as any).redisService = redisService;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Mount Better Auth handler BEFORE other body parsing middleware
// This is crucial - Better Auth must be mounted before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

// Body parsing middleware - AFTER Better Auth handler
app.use(compression() as unknown as express.RequestHandler);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Health check endpoint
app.get('/health', async (_req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'checking',
      redis: 'checking'
    }
  };

  try {
    // Check database connectivity
    const dbHealthy = await databaseService.healthCheck();
    healthCheck.services.database = dbHealthy ? 'healthy' : 'unhealthy';

    // Check Redis connectivity
    const redisHealthy = await redisService.healthCheck();
    healthCheck.services.redis = redisHealthy ? 'healthy' : 'unhealthy';

    // Determine overall status
    const allServicesHealthy = dbHealthy && redisHealthy;
    healthCheck.status = allServicesHealthy ? 'ok' : 'degraded';

    const statusCode = allServicesHealthy ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      ...healthCheck,
      status: 'error',
      error: 'Health check failed',
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    });
  }
});

// Better Auth session endpoint - demonstrates proper Express integration
app.get('/api/auth/me', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    return res.json(session);
  } catch (error) {
    logger.error('Error getting session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Better Auth health check endpoint
app.get('/api/auth/ok', (_req, res) => {
  return res.json({ status: 'ok', message: 'Better Auth is running' });
});

// Better Auth middleware demonstration routes
import { attachBetterAuthSession, requireBetterAuth, requireRole, getCurrentUser } from './middleware/betterAuth.js';

// Attach session middleware to demonstration routes
app.use('/api/better-auth-demo', attachBetterAuthSession);

// Public route that shows user info if authenticated
app.get('/api/better-auth-demo/status', (req, res) => {
  const user = getCurrentUser(req);
  res.json({
    authenticated: !!user,
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    } : null,
    message: user ? `Welcome ${user.name}!` : 'Not authenticated'
  });
});

// Protected route requiring authentication
app.get('/api/better-auth-demo/protected', requireBetterAuth, (req, res) => {
  const user = getCurrentUser(req);
  res.json({
    message: 'This is a protected route - authentication required',
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role
    },
    timestamp: new Date().toISOString()
  });
});

// Admin-only protected route
app.get('/api/better-auth-demo/admin', requireRole('admin'), (req, res) => {
  const user = getCurrentUser(req);
  res.json({
    message: 'Admin access granted - you have admin privileges',
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role
    },
    timestamp: new Date().toISOString()
  });
});

// Multi-role protected route (cashier, manager, or admin)
app.get('/api/better-auth-demo/staff', requireRole(['cashier', 'manager', 'admin']), (req, res) => {
  const user = getCurrentUser(req);
  res.json({
    message: 'Staff access granted - you have staff privileges',
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role
    },
    allowedRoles: ['cashier', 'manager', 'admin'],
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/legacy-auth', authRoutes);
// Enhanced Authentication routes (enterprise security features)
app.use('/api/enhanced-auth', enhancedAuthRoutes);
// Database monitoring routes (admin only)
app.use('/api/database', databaseMonitoringRoutes);
// Error tracking routes (admin only)
app.use('/api/errors', errorTrackingRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/suppliers', authMiddleware, supplierRoutes);
app.use('/api/loans', authMiddleware, loanRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/settings', authMiddleware, settingRoutes);
app.use('/api/pricing', authMiddleware, pricingRoutes);
app.use('/api/jwt-test', jwtTestRoutes);
app.use('/api/simple-jwt-test', simpleJwtTestRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// Setup comprehensive error tracking
setupErrorTracking(app);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(async () => {
    try {
      await databaseService.disconnect();
      await databasePoolService.disconnect();
      await redisService.disconnect();
      await ErrorTrackingService.getInstance().cleanup();
      logger.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  server.close(async () => {
    try {
      await databaseService.disconnect();
      await databasePoolService.disconnect();
      await redisService.disconnect();
      await ErrorTrackingService.getInstance().cleanup();
      logger.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

// Start server
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Initialize database connection
    await databaseService.connect();
    logger.info('Database connected successfully');
    
    // Initialize database pool and warm up connections
    await databasePoolService.warmUp();
    logger.info('Database pool warmed up successfully');
    
    // Initialize Redis connection
    await redisService.connect();
    logger.info('Redis connected successfully');
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 API Documentation: http://localhost:${PORT}/docs`);
      logger.info(`🔍 Health Check: http://localhost:${PORT}/health`);
      logger.info(`📊 Database Monitoring: http://localhost:${PORT}/api/database/metrics`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize the server
startServer().catch(console.error);

export { app, server, io };
