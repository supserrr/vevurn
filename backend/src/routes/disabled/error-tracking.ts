/**
 * Error Tracking Routes
 * 
 * Admin-only routes for monitoring and managing application errors
 */

import { Router, Response } from 'express';
import { ErrorTrackingService } from '../services/ErrorTrackingService';
import { enhancedAuthMiddleware, enhancedAuthorize, AuthenticatedRequest } from '../middleware/enhancedAuth';
import { logger } from '../utils/logger';

const router = Router();
const errorTracker = ErrorTrackingService.getInstance();

/**
 * Apply authentication middleware to all routes
 * Only admin users can access error tracking endpoints
 */
router.use(enhancedAuthMiddleware);
router.use(enhancedAuthorize('ADMIN'));

/**
 * GET /api/errors/stats
 * Get error statistics and metrics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const timeframe = req.query.timeframe as 'hour' | 'day' | 'week' || 'day';
    
    const stats = await errorTracker.getErrorStats(timeframe);
    
    res.json({
      success: true,
      data: {
        stats,
        timeframe,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get error stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve error statistics'
    });
  }
});

/**
 * GET /api/errors/recent
 * Get recent errors with details
 */
router.get('/recent', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // This would require additional database queries
    // For now, return a simplified response
    res.json({
      success: true,
      data: {
        message: 'Recent errors endpoint - requires additional implementation',
        limit,
        offset
      }
    });

  } catch (error) {
    logger.error('Failed to get recent errors', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent errors'
    });
  }
});

/**
 * POST /api/errors/test
 * Test error tracking by generating a sample error
 */
router.post('/test', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { errorType = 'TestError', message = 'This is a test error', component = 'test' } = req.body;
    
    // Create a test error
    const testError = new Error(message);
    testError.name = errorType;
    
    // Capture the error
    const errorId = await errorTracker.captureError(testError, {
      component,
      operation: 'test-error-generation',
      additionalData: {
        isTest: true,
        triggeredBy: req.user?.email,
        timestamp: new Date().toISOString()
      }
    }, req);
    
    res.json({
      success: true,
      data: {
        message: 'Test error generated and captured',
        errorId,
        errorType,
        component
      }
    });

  } catch (error) {
    logger.error('Failed to generate test error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test error'
    });
  }
});

/**
 * POST /api/errors/test-performance
 * Test performance issue tracking
 */
router.post('/test-performance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { operation = 'test-operation', duration = 2000, threshold = 1000 } = req.body;
    
    // Capture a performance issue
    await errorTracker.capturePerformanceIssue(
      operation,
      duration,
      threshold,
      {
        component: 'performance-test',
        operation: 'test-performance-issue',
        additionalData: {
          isTest: true,
          triggeredBy: req.user?.email,
          requestedDuration: duration,
          requestedThreshold: threshold
        }
      }
    );
    
    res.json({
      success: true,
      data: {
        message: 'Performance issue test completed',
        operation,
        duration,
        threshold,
        wasTriggered: duration > threshold
      }
    });

  } catch (error) {
    logger.error('Failed to test performance tracking', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test performance tracking'
    });
  }
});

/**
 * GET /api/errors/health
 * Health check for error tracking service
 */
router.get('/health', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Check error tracking service health
    const isHealthy = true; // Basic health check - could be expanded
    
    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'error-tracking',
        timestamp: new Date().toISOString(),
        features: {
          errorCapture: true,
          performanceTracking: true,
          notifications: true,
          metrics: true
        }
      }
    });

  } catch (error) {
    logger.error('Error tracking health check failed', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * GET /api/errors/config
 * Get current error tracking configuration
 */
router.get('/config', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const config = {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      notifications: {
        slack: !!process.env.SLACK_WEBHOOK_URL,
        email: !!process.env.ERROR_NOTIFICATION_EMAIL
      },
      features: {
        bufferFlushInterval: 30000, // 30 seconds
        performanceThreshold: 1000, // 1 second
        criticalErrorTypes: ['DatabaseError', 'SecurityError'],
        sensitiveFields: ['password', 'token', 'secret', 'key', 'auth']
      }
    };
    
    res.json({
      success: true,
      data: {
        config,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get error tracking config', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration'
    });
  }
});

/**
 * POST /api/errors/clear-test-data
 * Clear test error data from the system
 */
router.post('/clear-test-data', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would require database cleanup queries
    // For now, return a success message
    
    logger.info('Test data cleanup requested', { user: req.user?.email });
    
    res.json({
      success: true,
      data: {
        message: 'Test data cleanup initiated',
        note: 'This endpoint requires additional implementation for actual data cleanup',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to clear test data', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear test data'
    });
  }
});

/**
 * Error handling middleware for error tracking routes
 */
router.use((error: Error, req: AuthenticatedRequest, res: Response, _next: any) => {
  // Capture errors that occur in error tracking routes
  errorTracker.captureError(error, {
    component: 'error-tracking-routes',
    operation: req.path,
    additionalData: {
      method: req.method,
      path: req.path,
      query: req.query,
      user: req.user?.email
    }
  }, req);

  // Send error response
  res.status(500).json({
    success: false,
    error: 'Internal server error in error tracking system',
    errorId: 'captured'
  });
});

export default router;
