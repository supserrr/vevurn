// Database Pool Monitoring Routes
// File: backend/src/routes/database-monitoring.ts

import express from 'express';
import { DatabasePoolService } from '../services/DatabasePoolService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

interface Recommendation {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

interface Alert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

// Admin-only middleware for database monitoring endpoints
const adminOnly = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: {
        message: 'Access denied. Admin privileges required.',
        code: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString()
      }
    });
    return;
  }
  next();
};

// Get basic database pool metrics
router.get('/metrics', authMiddleware, adminOnly, async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const dbPool = DatabasePoolService.getInstance();
    const metrics = dbPool.getMetrics();
    const config = dbPool.getConfig();
    const isHealthy = dbPool.isHealthy();

    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        metrics,
        config: {
          maxConnections: config.maxConnections,
          minConnections: config.minConnections,
          connectionTimeout: config.connectionTimeout,
          retryAttempts: config.retryAttempts
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get database metrics', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve database metrics',
        code: 'METRICS_FETCH_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get detailed database metrics with PostgreSQL statistics
router.get('/detailed-metrics', authMiddleware, adminOnly, async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const dbPool = DatabasePoolService.getInstance();
    const detailedMetrics = await dbPool.getDetailedMetrics();

    res.json({
      success: true,
      data: detailedMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get detailed database metrics', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve detailed database metrics',
        code: 'DETAILED_METRICS_FETCH_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Database health check endpoint
router.get('/health', authMiddleware, adminOnly, async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const dbPool = DatabasePoolService.getInstance();
    const isHealthy = dbPool.isHealthy();
    const metrics = dbPool.getMetrics();

    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      lastHealthCheck: metrics.lastHealthCheck,
      averageQueryTime: Math.round(metrics.averageQueryTime),
      errorRate: parseFloat(metrics.errorRate.toFixed(2)),
      slowQueries: metrics.slowQueries,
      connections: {
        active: metrics.activeConnections,
        total: metrics.totalConnections,
        idle: metrics.idleConnections
      }
    };

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database health check failed', error);
    res.status(503).json({
      success: false,
      error: {
        message: 'Database health check failed',
        code: 'HEALTH_CHECK_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Execute database warm-up
router.post('/warmup', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const dbPool = DatabasePoolService.getInstance();
    await dbPool.warmUp();

    logger.info('Database pool warm-up initiated by admin', {
      adminId: req.user?.id,
      adminEmail: req.user?.email
    });

    res.json({
      success: true,
      message: 'Database pool warm-up completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database warm-up failed', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Database warm-up failed',
        code: 'WARMUP_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Performance analysis endpoint
router.get('/performance', authMiddleware, adminOnly, async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const dbPool = DatabasePoolService.getInstance();
    const metrics = dbPool.getMetrics();
    const detailedMetrics = await dbPool.getDetailedMetrics();

    const performanceAnalysis = {
      overview: {
        status: dbPool.isHealthy() ? 'optimal' : 'degraded',
        averageQueryTime: metrics.averageQueryTime,
        slowQueriesCount: metrics.slowQueries,
        errorRate: metrics.errorRate
      },
      recommendations: [] as Recommendation[],
      alerts: [] as Alert[]
    };

    // Performance recommendations
    if (metrics.averageQueryTime > 500) {
      performanceAnalysis.recommendations.push({
        type: 'performance',
        message: 'Average query time is high. Consider optimizing queries or adding indexes.',
        severity: 'warning'
      });
    }

    if (metrics.errorRate > 5) {
      performanceAnalysis.recommendations.push({
        type: 'reliability',
        message: 'High error rate detected. Check application logic and database constraints.',
        severity: 'critical'
      });
    }

    if (metrics.slowQueries > 10) {
      performanceAnalysis.recommendations.push({
        type: 'optimization',
        message: 'Multiple slow queries detected. Review and optimize database queries.',
        severity: 'warning'
      });
    }

    // Connection pool analysis
    const connectionUtilization = (metrics.activeConnections / metrics.totalConnections) * 100;
    if (connectionUtilization > 80) {
      performanceAnalysis.alerts.push({
        type: 'capacity',
        message: `High connection pool utilization: ${connectionUtilization.toFixed(1)}%`,
        severity: 'warning'
      });
    }

    performanceAnalysis.recommendations.push({
      type: 'monitoring',
      message: 'Regularly monitor database performance metrics',
      severity: 'info'
    });

    res.json({
      success: true,
      data: {
        analysis: performanceAnalysis,
        metrics: detailedMetrics,
        connectionUtilization: parseFloat(connectionUtilization.toFixed(1))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to generate performance analysis', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate performance analysis',
        code: 'PERFORMANCE_ANALYSIS_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Database configuration endpoint
router.get('/config', authMiddleware, adminOnly, (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const dbPool = DatabasePoolService.getInstance();
    const config = dbPool.getConfig();

    res.json({
      success: true,
      data: {
        configuration: config,
        environment: process.env.NODE_ENV || 'development',
        databaseUrl: process.env.DATABASE_URL ? '[HIDDEN]' : 'Not configured'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get database configuration', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve database configuration',
        code: 'CONFIG_FETCH_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Real-time metrics endpoint (for dashboards)
router.get('/live-metrics', authMiddleware, adminOnly, async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const dbPool = DatabasePoolService.getInstance();
    const metrics = dbPool.getMetrics();
    const isHealthy = dbPool.isHealthy();

    // Real-time metrics optimized for dashboard display
    const liveMetrics = {
      timestamp: new Date().toISOString(),
      status: isHealthy ? 'healthy' : 'unhealthy',
      connections: {
        active: metrics.activeConnections,
        idle: metrics.idleConnections,
        total: metrics.totalConnections,
        utilization: ((metrics.activeConnections / metrics.totalConnections) * 100).toFixed(1)
      },
      performance: {
        averageQueryTime: Math.round(metrics.averageQueryTime),
        slowQueries: metrics.slowQueries,
        errorRate: parseFloat(metrics.errorRate.toFixed(2))
      },
      health: {
        isHealthy,
        lastCheck: metrics.lastHealthCheck
      }
    };

    res.json({
      success: true,
      data: liveMetrics
    });
  } catch (error) {
    logger.error('Failed to get live metrics', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve live metrics',
        code: 'LIVE_METRICS_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
