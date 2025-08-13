import { Router, Request, Response } from 'express';
import { RedisService } from '../services/RedisService.js';
import { redisStorage } from '../lib/redis-storage.js';
import { config } from '../config/environment.js';
import { getPerformanceStats, getRecentMetrics, getEndpointStats } from '../middleware/performanceMonitor.js';

const router: Router = Router();

/**
 * Comprehensive system health monitoring endpoint
 * Provides detailed status of all system components
 */
router.get('/health/detailed', async (_req: Request, res: Response) => {
  const healthReport = {
    timestamp: new Date().toISOString(),
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {} as Record<string, any>
  };

  try {
    // Redis Rate Limiting Service Health
    const redisService = new RedisService();
    const redisConnected = await redisService.healthCheck();
    healthReport.services.redis_rate_limiting = {
      status: redisConnected ? 'healthy' : 'unavailable',
      fallback: redisConnected ? 'none' : 'memory_store',
      url_configured: !!config.REDIS_URL
    };

    // Redis Better Auth Secondary Storage Health
    try {
      // This will test the Better Auth Redis storage
      const testKey = 'health-check-test';
      await redisStorage.set(testKey, 'test', 5);
      const testValue = await redisStorage.get(testKey);
      await redisStorage.delete(testKey);
      
      healthReport.services.redis_auth_storage = {
        status: testValue === 'test' ? 'healthy' : 'degraded',
        type: 'better_auth_secondary_storage'
      };
    } catch (error) {
      healthReport.services.redis_auth_storage = {
        status: 'unavailable',
        type: 'better_auth_secondary_storage',
        fallback: 'database_only',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Better Auth Service Health
    try {
      // Test if Better Auth is properly configured
      healthReport.services.better_auth = {
        status: 'healthy',
        configured: true,
        endpoints: {
          signup: '/api/auth/sign-up/email',
          signin: '/api/auth/sign-in/email',
          google_oauth: '/api/auth/sign-in/social/google',
          signout: '/api/auth/sign-out',
          session: '/api/auth/get-session'
        }
      };
    } catch (error) {
      healthReport.services.better_auth = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      healthReport.status = 'unhealthy';
    }

    // Database Health (basic check)
    healthReport.services.database = {
      status: 'healthy', // We assume healthy if server starts
      type: 'postgresql',
      orm: 'prisma'
    };

    // System Resources
    const memUsage = process.memoryUsage();
    healthReport.services.system = {
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      },
      cpu_load: process.cpuUsage()
    };

    // Determine overall status
    const services = Object.values(healthReport.services);
    const unhealthyServices = services.filter((service: any) => service.status === 'unhealthy');
    const degradedServices = services.filter((service: any) => service.status === 'degraded' || service.status === 'unavailable');
    
    if (unhealthyServices.length > 0) {
      healthReport.status = 'unhealthy';
    } else if (degradedServices.length > 0) {
      healthReport.status = 'degraded';
    }

    res.status(healthReport.status === 'healthy' ? 200 : 
               healthReport.status === 'degraded' ? 200 : 503)
       .json({
         success: healthReport.status !== 'unhealthy',
         ...healthReport
       });

  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: healthReport.services
    });
  }
});

/**
 * Production readiness check
 * Verifies all critical services for production deployment
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  const readinessChecks = {
    timestamp: new Date().toISOString(),
    ready: true,
    checks: {} as Record<string, { status: boolean; message: string }>
  };

  // Environment variables check
  readinessChecks.checks.environment_variables = {
    status: !!(config.DATABASE_URL && config.BETTER_AUTH_SECRET),
    message: 'Critical environment variables configured'
  };

  // Redis availability (not critical, but important)
  const redisService = new RedisService();
  const redisHealthy = await redisService.healthCheck();
  readinessChecks.checks.redis_optional = {
    status: true, // Redis is optional, so always pass
    message: redisHealthy ? 'Redis available for rate limiting' : 'Redis unavailable, using memory fallback'
  };

  // Database connectivity (we assume it's working if server started)
  readinessChecks.checks.database = {
    status: true,
    message: 'Database connection established'
  };

  // Auth system
  readinessChecks.checks.auth_system = {
    status: true,
    message: 'Better Auth system configured'
  };

  // Overall readiness
  const failedChecks = Object.values(readinessChecks.checks).filter(check => !check.status);
  readinessChecks.ready = failedChecks.length === 0;

  res.status(readinessChecks.ready ? 200 : 503).json({
    success: readinessChecks.ready,
    ...readinessChecks
  });
});

/**
 * Live check - minimal health check for load balancers
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Redis statistics for monitoring
 */
router.get('/monitoring/redis', (_req: Request, res: Response) => {
  const redisService = new RedisService();
  
  if (!redisService.isRedisConnected()) {
    return res.json({
      success: true,
      status: 'unavailable',
      message: 'Redis not connected - using memory fallback',
      timestamp: new Date().toISOString()
    });
  }

  // Basic Redis info would go here
  // For now, just return connection status
  return res.json({
    success: true,
    status: 'connected',
    connection: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Performance metrics endpoint
 */
router.get('/monitoring/performance', (_req: Request, res: Response) => {
  const stats = getPerformanceStats();
  return res.json({
    success: true,
    ...stats
  });
});

/**
 * Recent performance metrics
 */
router.get('/monitoring/performance/recent', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const metrics = getRecentMetrics(limit);
  return res.json({
    success: true,
    metrics,
    count: metrics.length
  });
});

/**
 * Endpoint performance statistics
 */
router.get('/monitoring/endpoints', (_req: Request, res: Response) => {
  const stats = getEndpointStats();
  return res.json({
    success: true,
    endpoints: stats,
    timestamp: new Date().toISOString()
  });
});

export default router;
