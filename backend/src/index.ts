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
import { config, getAllowedOrigins, getBaseUrl } from './config/environment.js';

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

// Import services
import { RedisService } from './services/RedisService';
import { WebSocketService } from './services/WebSocketService';

// Initialize services with better error handling and connection pooling
let prisma: PrismaClient;
let redis: Redis | null;

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
  if (config.REDIS_URL) {
    redis = new Redis(config.REDIS_URL, {
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: process.env.NODE_ENV === 'production' ? 2 : 3,
      commandTimeout: process.env.NODE_ENV === 'production' ? 5000 : 10000,
      enableOfflineQueue: true, // Allow offline queuing
      family: 4 // Force IPv4
    });

    // Handle Redis connection events
    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.log('Redis connected');
    });

    redis.on('ready', () => {
      console.log('Redis ready');
    });
  } else {
    console.warn('⚠️ Redis URL not configured, skipping Redis initialization');
    redis = null;
  }
} catch (error) {
  console.error('❌ Failed to initialize Redis Client:', error);
  redis = null;
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
 * Verify all services are healthy on startup with detailed logging
 */
async function verifyServices() {
  const services = {
    database: false,
    redis: false,
    auth: false,
    environment: false,
    webSockets: false,
    rateLimiting: false
  };

  console.log('🔍 ==============================================');
  console.log('🔍 STARTING SERVICE HEALTH VERIFICATION');
  console.log('🔍 ==============================================');

  // Check Database Connection
  console.log('📊 Checking Database Connection...');
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    services.database = true;
    console.log('✅ Database Service: INITIALIZED SUCCESSFULLY');
    console.log('   └─ PostgreSQL connection established');
    console.log('   └─ Query execution verified');
  } catch (error) {
    console.log('❌ Database Service: INITIALIZATION FAILED');
    console.error('   └─ Database error:', error);
  }

  // Check Redis Connection
  console.log('🔴 Checking Redis Connection...');
  try {
    if (!redis) {
      console.log('⚠️  Redis Service: NOT CONFIGURED');
      console.log('   └─ Redis client not initialized (will use database fallback)');
    } else if (redis.status === 'ready' || redis.status === 'connect') {
      await redis.ping();
      services.redis = true;
      console.log('✅ Redis Service: INITIALIZED SUCCESSFULLY');
      console.log('   └─ Connection established and verified');
      console.log('   └─ Secondary storage available for Better Auth');
    } else {
      // Try to connect if not already connected
      await redis.connect();
      await redis.ping();
      services.redis = true;
      console.log('✅ Redis Service: INITIALIZED SUCCESSFULLY');
      console.log('   └─ Connection established after reconnect');
    }
  } catch (error) {
    console.log('❌ Redis Service: INITIALIZATION FAILED');
    console.error('   └─ Redis error:', error);
    console.log('   └─ Will fallback to database-only mode');
  }

  // Check Environment Variables
  console.log('⚙️  Checking Environment Configuration...');
  try {
    const requiredVars = ['DATABASE_URL', 'BETTER_AUTH_SECRET'];
    const missingVars = requiredVars.filter(varName => !config[varName as keyof typeof config]);
    
    if (missingVars.length === 0) {
      services.environment = true;
      console.log('✅ Environment Service: INITIALIZED SUCCESSFULLY');
      console.log('   └─ All required environment variables present');
      console.log('   └─ Configuration validated');
      
      // Optional environment variables logging
      const optionalServices = {
        'Redis': config.REDIS_URL,
        'Google OAuth': config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET,
        'Microsoft OAuth': config.MICROSOFT_CLIENT_ID && config.MICROSOFT_CLIENT_SECRET,
        'GitHub OAuth': config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET,
        'AWS S3': config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY,
        'SMTP Email': config.SMTP_HOST && config.SMTP_USER
      };
      
      Object.entries(optionalServices).forEach(([service, configured]) => {
        console.log(`   └─ ${service}: ${configured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      });
      
    } else {
      console.log('❌ Environment Service: INITIALIZATION FAILED');
      console.log(`   └─ Missing required variables: ${missingVars.join(', ')}`);
    }
  } catch (error) {
    console.log('❌ Environment Service: INITIALIZATION FAILED');
    console.error('   └─ Environment error:', error);
  }

  // Check Better Auth Setup
  console.log('🔐 Checking Better Auth Configuration...');
  try {
    if (config.BETTER_AUTH_SECRET && config.BETTER_AUTH_URL) {
      services.auth = true;
      console.log('✅ Better Auth Service: INITIALIZED SUCCESSFULLY');
      console.log('   └─ Secret key configured');
      console.log('   └─ Base URL configured');
      console.log(`   └─ Auth endpoint: ${config.BETTER_AUTH_URL}/api/auth`);
    } else {
      console.log('❌ Better Auth Service: INITIALIZATION FAILED');
      console.log('   └─ Missing required auth configuration');
    }
  } catch (error) {
    console.log('❌ Better Auth Service: INITIALIZATION FAILED');
    console.error('   └─ Auth error:', error);
  }

  // Check WebSocket Service
  console.log('🔌 Checking WebSocket Service...');
  try {
    if (webSocketService && io) {
      services.webSockets = true;
      console.log('✅ WebSocket Service: INITIALIZED SUCCESSFULLY');
      console.log('   └─ Socket.IO server configured');
      console.log('   └─ Real-time communication enabled');
      console.log(`   └─ CORS origins: ${getAllowedOrigins().join(', ')}`);
    } else {
      console.log('❌ WebSocket Service: INITIALIZATION FAILED');
      console.log('   └─ Socket.IO server not initialized');
    }
  } catch (error) {
    console.log('❌ WebSocket Service: INITIALIZATION FAILED');
    console.error('   └─ WebSocket error:', error);
  }

  // Check Rate Limiting Service
  console.log('🛡️  Checking Rate Limiting Service...');
  try {
    // Import rate limiting config
    const { getBetterAuthRateLimitConfig } = await import('./lib/rate-limit-config.js');
    const rateLimitConfig = getBetterAuthRateLimitConfig();
    
    if (rateLimitConfig) {
      services.rateLimiting = true;
      console.log('✅ Rate Limiting Service: INITIALIZED SUCCESSFULLY');
      console.log(`   └─ Storage: ${services.redis ? 'Redis (primary)' : 'Memory (fallback)'}`);
      console.log('   └─ Better Auth rate limiting enabled');
      console.log('   └─ Custom rate limiting available');
    } else {
      console.log('⚠️  Rate Limiting Service: PARTIALLY INITIALIZED');
      console.log('   └─ Basic rate limiting only');
    }
  } catch (error) {
    console.log('❌ Rate Limiting Service: INITIALIZATION FAILED');
    console.error('   └─ Rate limiting error:', error);
  }

  console.log('🔍 ==============================================');
  console.log('🔍 SERVICE HEALTH VERIFICATION COMPLETE');
  console.log('🔍 ==============================================');

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
// Removed to avoid ES module issues in production deployment

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
      console.log('\n📋 Service Health Summary:');
      console.log(`  ${serviceHealth.database ? '✅' : '❌'} Database: ${serviceHealth.database ? 'Connected & Operational' : 'Connection Failed'}`);
      console.log(`  ${serviceHealth.redis ? '✅' : '⚠️ '} Redis: ${serviceHealth.redis ? 'Connected & Operational' : 'Using Fallback Storage'}`);
      console.log(`  ${serviceHealth.auth ? '✅' : '❌'} Better Auth: ${serviceHealth.auth ? 'Configured & Ready' : 'Configuration Failed'}`);
      console.log(`  ${serviceHealth.environment ? '✅' : '❌'} Environment: ${serviceHealth.environment ? 'All Required Variables Set' : 'Missing Required Variables'}`);
      console.log(`  ${serviceHealth.webSockets ? '✅' : '❌'} WebSocket: ${serviceHealth.webSockets ? 'Socket.IO Server Active' : 'Socket.IO Failed'}`);
      console.log(`  ${serviceHealth.rateLimiting ? '✅' : '❌'} Rate Limiting: ${serviceHealth.rateLimiting ? 'Protection Active' : 'Protection Failed'}`);
      
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
          if (redis) {
            redis.disconnect();
            console.log('✅ Redis disconnected');
          }
          
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

// Import OAuth testing utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/oauth-test.js').then(({ testGoogleOAuth, logOAuthDebugInfo }) => {
    // Make testing functions available globally in development
    (global as any).testGoogleOAuth = testGoogleOAuth;
    (global as any).logOAuthDebugInfo = logOAuthDebugInfo;
  }).catch(() => {
    // Ignore import errors in case the file doesn't exist
  });
}

export default app;
