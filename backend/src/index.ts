import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Only load dotenv in development - production uses environment variables directly
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Import configuration first
import { config, getAllowedOrigins, getBaseUrl, isProduction } from './config/environment';

// Service Health Check Function
async function performHealthChecks(): Promise<{ [key: string]: 'SUCCESS' | 'FAILURE' }> {
  const results: { [key: string]: 'SUCCESS' | 'FAILURE' } = {};
  
  console.log('🔍 Verifying service health...');
  
  // 1. Environment Variables Check
  try {
    const requiredVars = ['DATABASE_URL', 'REDIS_URL', 'BETTER_AUTH_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      results['Environment variables'] = 'SUCCESS';
      console.log('✅ Environment variables: SUCCESS');
    } else {
      results['Environment variables'] = 'FAILURE';
      console.log(`❌ Environment variables: FAILURE (missing: ${missingVars.join(', ')})`);
    }
  } catch (error) {
    results['Environment variables'] = 'FAILURE';
    console.log('❌ Environment variables: FAILURE');
  }
  
  // 2. Database Connection Check
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    
    results['Database connection'] = 'SUCCESS';
    console.log('✅ Database connection: SUCCESS');
  } catch (error) {
    results['Database connection'] = 'FAILURE';
    console.log('❌ Database connection: FAILURE');
  }
  
  // 3. Redis Connection Check
  try {
    const Redis = await import('ioredis');
    const redis = new Redis.default(config.REDIS_URL);
    await redis.ping();
    redis.disconnect();
    
    results['Redis connection'] = 'SUCCESS';
    console.log('✅ Redis connection: SUCCESS');
  } catch (error) {
    results['Redis connection'] = 'FAILURE';
    console.log('❌ Redis connection: FAILURE');
  }
  
  // 4. Authentication Setup Check
  try {
    if (config.BETTER_AUTH_SECRET && config.BETTER_AUTH_URL) {
      results['Authentication'] = 'SUCCESS';
      console.log('✅ Authentication: SUCCESS');
    } else {
      results['Authentication'] = 'FAILURE';
      console.log('❌ Authentication: FAILURE (missing auth configuration)');
    }
  } catch (error) {
    results['Authentication'] = 'FAILURE';
    console.log('❌ Authentication: FAILURE');
  }
  
  return results;
}

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Import Better Auth
import { auth } from './lib/index.js';
import { toNodeHandler } from 'better-auth/node';

// Disabled routes for build optimization  
// import userRoutes from './routes/users';
// import loanRoutes from './routes/loans';
// import settingRoutes from './routes/settings';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import saleRoutes from './routes/sales';
import customerRoutes from './routes/customers';
import supplierRoutes from './routes/suppliers';
// import loanRoutes from './routes/loans';
import reportRoutes from './routes/reports';
// import settingRoutes from './routes/settings';
import pricingRoutes from './routes/pricing.routes';
import mobileMoneyRoutes from './routes/mobileMoneyRoutes'; // NEW
// import { analyticsRoutes } from './routes/analytics';
// Disabled routes for build optimization
// import { exportsRoutes } from './routes/exports';
// import { gdprRoutes } from './routes/gdpr';
// import backupRoutes from './routes/backup';
// import localizationRoutes from './routes/localization';

// Import services
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { WebSocketService } from './services/WebSocketService';

// Create Express app
const app = express();
const server = createServer(app);

// Initialize services
const databaseService = new DatabaseService();
const redisService = new RedisService();
const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true
  }
});
const webSocketService = new WebSocketService(io);

// Make services available globally
(global as any).webSocketService = webSocketService;
(global as any).redisService = redisService;

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression() as any);

// CORS configuration
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Health check endpoints with comprehensive status
app.get('/health', async (_req, res) => {
  try {
    const healthResults = await performHealthChecks();
    const allHealthy = Object.values(healthResults).every(status => status === 'SUCCESS');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      service: 'vevurn-pos-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: healthResults,
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

app.get('/api/health', async (_req, res) => {
  try {
    const healthResults = await performHealthChecks();
    const allHealthy = Object.values(healthResults).every(status => status === 'SUCCESS');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      service: 'vevurn-pos-api',
      timestamp: new Date().toISOString(),
      services: healthResults
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

// Better Auth handler
app.all('/api/auth/*', toNodeHandler(auth));

// API routes (ALL UPDATED FOR BETTER AUTH - middleware will be applied in route files)
// app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
// app.use('/api/loans', loanRoutes);
app.use('/api/reports', reportRoutes);
// app.use('/api/settings', settingRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/mobile-money', mobileMoneyRoutes); // NEW
// app.use('/api/analytics', analyticsRoutes);
// Disabled routes for build optimization
// app.use('/api/exports', exportsRoutes);
// app.use('/api/gdpr', gdprRoutes);
// app.use('/api/backup', backupRoutes);
// app.use('/api/localization', localizationRoutes);

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

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, starting graceful shutdown`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await databaseService.disconnect();
      await redisService.disconnect();
      console.log('Database and Redis connections closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server with comprehensive health checks
async function startServer() {
  try {
    // Perform health checks
    const healthResults = await performHealthChecks();
    
    // Check if all services are healthy
    const allHealthy = Object.values(healthResults).every(status => status === 'SUCCESS');
    
    // Start the server
    server.listen(config.PORT, config.HOST, () => {
      const baseUrl = getBaseUrl();
      
      console.log('\n🚀 Vevurn POS Backend Started Successfully!');
      console.log(`📊 Health Check: ${baseUrl}/health`);
      console.log(`🔐 Better Auth: ${baseUrl}/api/auth`);
      console.log(`� Allowed Origins: ${getAllowedOrigins().join(', ')}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`🏠 Running on: ${config.HOST}:${config.PORT}`);
      
      // Overall health status
      if (allHealthy) {
        console.log('✅ ALL SERVICES HEALTHY');
      } else {
        console.log('⚠️  SOME SERVICES HAVE ISSUES - CHECK LOGS ABOVE');
      }
      
      console.log('\n' + '='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Call the start function
startServer();

// Graceful shutdown listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
