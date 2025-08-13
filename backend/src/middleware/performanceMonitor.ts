import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface PerformanceMetrics {
  responseTime: number;
  method: string;
  url: string;
  statusCode: number;
  timestamp: string;
  memoryUsage?: {
    used: number;
    total: number;
  };
}

// In-memory store for recent performance metrics
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 requests

/**
 * Performance monitoring middleware
 * Tracks response times and system metrics for each request
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to capture metrics
  res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    // Create performance metric
    const metric: PerformanceMetrics = {
      responseTime,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString(),
      memoryUsage: {
        used: Math.round(endMemory.heapUsed / 1024 / 1024), // MB
        total: Math.round(endMemory.heapTotal / 1024 / 1024) // MB
      }
    };

    // Add to metrics store (keep only last MAX_METRICS)
    performanceMetrics.push(metric);
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.shift(); // Remove oldest metric
    }

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn('Slow request detected:', metric);
    }

    // Log very slow requests (> 5 seconds) as errors
    if (responseTime > 5000) {
      logger.error('Very slow request detected:', metric);
    }

    // Log general performance info for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`);
    }

    // Call original end function
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

/**
 * Get performance statistics
 */
export const getPerformanceStats = () => {
  if (performanceMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequestsCount: 0,
      errorRate: 0,
      memoryUsage: process.memoryUsage()
    };
  }

  const total = performanceMetrics.length;
  const totalResponseTime = performanceMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
  const averageResponseTime = totalResponseTime / total;
  const slowRequests = performanceMetrics.filter(metric => metric.responseTime > 1000).length;
  const errorRequests = performanceMetrics.filter(metric => metric.statusCode >= 400).length;
  const errorRate = (errorRequests / total) * 100;

  // Calculate percentiles
  const sortedTimes = performanceMetrics.map(m => m.responseTime).sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

  // Get recent metrics (last 100 requests)
  const recentMetrics = performanceMetrics.slice(-100);
  const recentAverageTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;

  return {
    totalRequests: total,
    averageResponseTime: Math.round(averageResponseTime),
    recentAverageResponseTime: Math.round(recentAverageTime),
    slowRequestsCount: slowRequests,
    errorRate: Math.round(errorRate * 100) / 100, // Round to 2 decimal places
    percentiles: {
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99)
    },
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
};

/**
 * Get recent performance metrics
 */
export const getRecentMetrics = (limit = 50) => {
  return performanceMetrics.slice(-limit).map(metric => ({
    ...metric,
    responseTime: Math.round(metric.responseTime)
  }));
};

/**
 * Clear performance metrics (useful for testing)
 */
export const clearPerformanceMetrics = () => {
  performanceMetrics.length = 0;
};

/**
 * Get endpoints with their average response times
 */
export const getEndpointStats = () => {
  const endpointStats = new Map<string, { totalTime: number; count: number; errors: number }>();
  
  performanceMetrics.forEach(metric => {
    const key = `${metric.method} ${metric.url}`;
    const existing = endpointStats.get(key) || { totalTime: 0, count: 0, errors: 0 };
    
    existing.totalTime += metric.responseTime;
    existing.count += 1;
    if (metric.statusCode >= 400) {
      existing.errors += 1;
    }
    
    endpointStats.set(key, existing);
  });
  
  const results = Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
    endpoint,
    averageResponseTime: Math.round(stats.totalTime / stats.count),
    requestCount: stats.count,
    errorCount: stats.errors,
    errorRate: Math.round((stats.errors / stats.count) * 100 * 100) / 100 // Round to 2 decimal places
  }));
  
  // Sort by average response time (slowest first)
  return results.sort((a, b) => b.averageResponseTime - a.averageResponseTime);
};
