/**
 * Production Performance Monitoring Utilities
 * Tracks key metrics for production optimization
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  requestDuration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: number;
  route: string;
  method: string;
  statusCode: number;
}

class ProductionMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory
  private observer?: PerformanceObserver;

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.initializePerformanceObserver();
    }
  }

  private initializePerformanceObserver(): void {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.startsWith('http-request-')) {
          console.log(`📊 ${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    this.observer.observe({ entryTypes: ['measure'] });
  }

  /**
   * Middleware to track request performance
   */
  public trackRequest() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = performance.now();
      const startCpuUsage = process.cpuUsage();
      const routeName = `${req.method}-${req.route?.path || req.path}`;
      
      // Mark start of request
      performance.mark(`${routeName}-start`);

      res.on('finish', () => {
        try {
          const endTime = performance.now();
          const endCpuUsage = process.cpuUsage(startCpuUsage);
          const duration = endTime - startTime;

          // Mark end of request and measure
          performance.mark(`${routeName}-end`);
          performance.measure(
            `http-request-${routeName}-${Date.now()}`,
            `${routeName}-start`,
            `${routeName}-end`
          );

          const metrics: PerformanceMetrics = {
            requestDuration: duration,
            memoryUsage: process.memoryUsage(),
            cpuUsage: endCpuUsage,
            timestamp: Date.now(),
            route: req.route?.path || req.path,
            method: req.method,
            statusCode: res.statusCode,
          };

          this.addMetric(metrics);

          // Log slow requests in production
          if (process.env.NODE_ENV === 'production' && duration > 1000) {
            console.warn(`🐌 Slow request detected: ${routeName} took ${duration.toFixed(2)}ms`);
          }

        } catch (error) {
          console.error('📊 Error tracking request performance:', error);
        }
      });

      next();
    };
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary() {
    if (this.metrics.length === 0) {
      return { message: 'No metrics available' };
    }

    const recent = this.metrics.slice(-100); // Last 100 requests
    const durations = recent.map(m => m.requestDuration);
    const memoryUsages = recent.map(m => m.memoryUsage.heapUsed);
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;

    return {
      totalRequests: this.metrics.length,
      recentRequests: recent.length,
      averageResponseTime: Math.round(avgDuration * 100) / 100,
      maxResponseTime: Math.round(maxDuration * 100) / 100,
      minResponseTime: Math.round(minDuration * 100) / 100,
      averageMemoryUsage: Math.round(avgMemory / 1024 / 1024 * 100) / 100, // MB
      currentMemoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100, // MB
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  /**
   * Get health metrics for monitoring
   */
  public getHealthMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
        rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: Math.round(process.uptime()),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.metrics = [];
  }
}

// Export singleton instance
export const productionMonitor = new ProductionMonitor();

/**
 * Memory usage middleware for production monitoring
 */
export const memoryMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const memBefore = process.memoryUsage();
  
  res.on('finish', () => {
    const memAfter = process.memoryUsage();
    const heapDiff = memAfter.heapUsed - memBefore.heapUsed;
    
    // Log significant memory increases
    if (heapDiff > 10 * 1024 * 1024) { // 10MB
      console.warn(`🧠 High memory usage detected: ${Math.round(heapDiff / 1024 / 1024)}MB increase for ${req.method} ${req.path}`);
    }
  });
  
  next();
};

/**
 * Database connection pool monitoring
 */
export const monitorDatabasePool = () => {
  // This would integrate with Prisma metrics if available
  setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
      console.warn(`🗄️ High database memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }
  }, 60000); // Check every minute
};

export default productionMonitor;
