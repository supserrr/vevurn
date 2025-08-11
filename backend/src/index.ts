import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Only load dotenv in development - production uses environment variables directly
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Import configuration
import { config, getAllowedOrigins, getBaseUrl } from './config/environment';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Import Better Auth
import { auth } from './lib/index.js';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';

// Import routes
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import saleRoutes from './routes/sales';
import customerRoutes from './routes/customers';
import supplierRoutes from './routes/suppliers';
import reportRoutes from './routes/reports';
import pricingRoutes from './routes/pricing.routes';
import mobileMoneyRoutes from './routes/mobileMoneyRoutes';
import authRoutes from './routes/authRoutes';

// Import authentication middleware
import { requireAuth, requireEmailVerified } from './middleware/authMiddleware';

// Import testing utilities (only in non-production)
const createTestRoute = process.env.NODE_ENV === 'production' ? null : require('./utils/betterAuthExpressTest').createTestRoute;

// Import services
import { RedisService } from './services/RedisService';
import { WebSocketService } from './services/WebSocketService';

// Initialize services with better error handling and connection pooling
let prisma: PrismaClient;
let redis: Redis;

// Production-optimized Prisma configuration
try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
    datasources: {
      db: {
        url: config.DATABASE_URL
      }
    }
  });
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error);
  process.exit(1);
}

// Production-optimized Redis configuration
try {
  redis = new Redis(config.REDIS_URL, {
    connectTimeout: 10000,
    lazyConnect: true,
    maxRetriesPerRequest: process.env.NODE_ENV === 'production' ? 2 : 3,
    commandTimeout: process.env.NODE_ENV === 'production' ? 5000 : 10000,
    enableOfflineQueue: false,
    family: 4, // Force IPv4
  });
} catch (error) {
  console.error('❌ Failed to initialize Redis Client:', error);
  process.exit(1);
}

// Create Express app
const app = express();
const server = createServer(app);

// Initialize services
const redisService = new RedisService();
const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true
  },
  // Production optimizations
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: process.env.NODE_ENV === 'production' ? ['websocket'] : ['polling', 'websocket'],
  allowEIO3: false,
  serveClient: false,
});
const webSocketService = new WebSocketService(io);

// Make services available globally
(global as any).webSocketService = webSocketService;
(global as any).redisService = redisService;

/**
 * Verify all services are healthy on startup
 */
async function verifyServices() {
  const services = {
    database: false,
    redis: false,
    auth: false,
    environment: false
  };

  console.log('🔍 Verifying service health...');

  // Check Database Connection
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    services.database = true;
    console.log('✅ Database connection: SUCCESS');
  } catch (error) {
    console.log('❌ Database connection: FAILED');
    console.error('Database error:', error);
  }

  // Check Redis Connection
  try {
    await redis.ping();
    services.redis = true;
    console.log('✅ Redis connection: SUCCESS');
  } catch (error) {
    console.log('❌ Redis connection: FAILED');
    console.error('Redis error:', error);
  }

  // Check Environment Variables
  try {
    if (config.DATABASE_URL && config.REDIS_URL && config.BETTER_AUTH_SECRET) {
      services.environment = true;
      console.log('✅ Environment variables: SUCCESS');
    } else {
      console.log('❌ Environment variables: FAILED - Missing required variables');
    }
  } catch (error) {
    console.log('❌ Environment variables: FAILED');
    console.error('Environment error:', error);
  }

  // Check Better Auth Setup
  try {
    if (config.BETTER_AUTH_SECRET && config.BETTER_AUTH_URL) {
      services.auth = true;
      console.log('✅ Better Auth configuration: SUCCESS');
    } else {
      console.log('❌ Better Auth configuration: FAILED');
    }
  } catch (error) {
    console.log('❌ Better Auth configuration: FAILED');
    console.error('Auth error:', error);
  }

  return services;
}

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Production-optimized security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  } : false,
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
}));

// Compression with production settings
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: process.env.NODE_ENV === 'production' ? 6 : 1,
  threshold: 1024,
}) as any);

// CORS configuration
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// IMPORTANT: Better Auth handler MUST be mounted BEFORE other middleware
app.all('/api/auth/*', toNodeHandler(auth));

// Basic middleware (mounted AFTER Better Auth handler per documentation)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Health check endpoints with comprehensive status
app.get('/health', async (_req, res) => {
  try {
    const serviceHealth = await verifyServices();
    const allHealthy = Object.values(serviceHealth).every(status => status);
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      service: 'vevurn-pos-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: serviceHealth,
      urls: {
        backend: getBaseUrl(),
        frontend: config.FRONTEND_URL,
        auth: `${getBaseUrl()}/api/auth`
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'vevurn-pos-backend',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Better Auth session endpoint - Following Express integration documentation
app.get('/api/me', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'No valid session found'
      });
    }
    
    return res.json({
      success: true,
      data: {
        user: session.user,
        session: {
          id: session.session.id,
          userId: session.session.userId,
          expiresAt: session.session.expiresAt,
          createdAt: session.session.createdAt,
          updatedAt: session.session.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ 
      error: 'Session retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Better Auth integration test endpoint (only in non-production)
if (process.env.NODE_ENV !== 'production' && createTestRoute) {
  app.get('/api/test/auth-integration', createTestRoute());
}

app.get('/api/health', async (_req, res) => {
  try {
    const serviceHealth = await verifyServices();
    const allHealthy = Object.values(serviceHealth).every(status => status);
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      service: 'vevurn-pos-api',
      timestamp: new Date().toISOString(),
      services: serviceHealth
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'vevurn-pos-api',
      timestamp: new Date().toISOString(),
      error: 'API health check failed'
    });
  }
});

// API routes with authentication middleware following Better Auth Express integration
app.use('/api/auth-info', authRoutes); // Additional auth endpoints (separate from Better Auth handler)
app.use('/api/customers', requireAuth, customerRoutes);
app.use('/api/products', requireAuth, productRoutes);
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/sales', requireAuth, requireEmailVerified, saleRoutes);
app.use('/api/suppliers', requireAuth, supplierRoutes);
app.use('/api/reports', requireAuth, requireEmailVerified, reportRoutes);
app.use('/api/pricing', requireAuth, pricingRoutes);
app.use('/api/mobile-money', requireAuth, requireEmailVerified, mobileMoneyRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handler (LAST)
app.use(errorHandler);

// Start server with enhanced logging
async function startServer() {
  try {
    // Verify services first
    const serviceHealth = await verifyServices();
    
    server.listen(config.PORT, config.HOST, () => {
      console.log('\n🎉 ==============================================');
      console.log('🚀 Vevurn POS Backend Started Successfully!');
      console.log('===============================================');
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`📡 Server: http://${config.HOST}:${config.PORT}`);
      console.log(`🔗 Base URL: https://vevurn.onrender.com`); // CORRECTED URL
      console.log('\n📋 Service Health Status:');
      console.log(`  ${serviceHealth.database ? '✅' : '❌'} Database: ${serviceHealth.database ? 'Healthy' : 'Unhealthy'}`);
      console.log(`  ${serviceHealth.redis ? '✅' : '❌'} Redis: ${serviceHealth.redis ? 'Healthy' : 'Unhealthy'}`);
      console.log(`  ${serviceHealth.auth ? '✅' : '❌'} Authentication: ${serviceHealth.auth ? 'Healthy' : 'Unhealthy'}`);
      console.log(`  ${serviceHealth.environment ? '✅' : '❌'} Environment: ${serviceHealth.environment ? 'Healthy' : 'Unhealthy'}`);
      
      console.log('\n🔗 API Endpoints:');
      console.log(`📊 Health Check: https://vevurn.onrender.com/health`); // CORRECTED
      console.log(`🔐 Better Auth: https://vevurn.onrender.com/api/auth`); // CORRECTED
      console.log(`📱 Mobile Money: https://vevurn.onrender.com/api/mobile-money`);
      console.log(`📈 Analytics: https://vevurn.onrender.com/api/analytics`);
      console.log(`📋 Exports: https://vevurn.onrender.com/api/exports`);
      console.log(`🔒 GDPR: https://vevurn.onrender.com/api/gdpr`);
      
      console.log('\n🌐 CORS Configuration:');
      console.log(`🔗 Allowed Origins: ${getAllowedOrigins().join(', ')}`); // CORRECTED to show only vevurn.vercel.app
      
      // Overall health summary
      const allHealthy = Object.values(serviceHealth).every(status => status);
      console.log('\n🎯 Overall Status:');
      console.log(`${allHealthy ? '✅ ALL SERVICES HEALTHY' : '⚠️  SOME SERVICES UNHEALTHY'}`);
      
      if (!allHealthy) {
        console.log('\n⚠️  Warning: Some services are not healthy. Check the logs above for details.');
      }
      
      console.log('===============================================\n');
    });

    // Graceful shutdown with proper cleanup
    const gracefulShutdown = (signal: string) => {
      console.log(`🛑 ${signal} received, shutting down gracefully...`);
      
      const shutdownTimeout = setTimeout(() => {
        console.error('❌ Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, 10000); // 10 second timeout
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          // Close WebSocket connections
          io.close();
          console.log('✅ WebSocket server closed');
          
          // Disconnect from database
          await prisma.$disconnect();
          console.log('✅ Database disconnected');
          
          // Disconnect from Redis
          redis.disconnect();
          console.log('✅ Redis disconnected');
          
          clearTimeout(shutdownTimeout);
          console.log('✅ Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          clearTimeout(shutdownTimeout);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Call the start function
startServer();

export default app;
