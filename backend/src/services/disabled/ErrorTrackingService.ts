// Comprehensive Error Tracking Service
// File: backend/src/services/ErrorTrackingService.ts

import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { RedisService } from './RedisService';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface ErrorContext {
  userId?: string | undefined;
  sessionId?: string | undefined;
  requestId?: string | undefined;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
  url?: string | undefined;
  method?: string | undefined;
  headers?: Record<string, string> | undefined;
  body?: any;
  query?: Record<string, any> | undefined;
  params?: Record<string, any> | undefined;
  timestamp: Date;
  environment: string;
  version: string;
  component?: string | undefined;
  operation?: string | undefined;
  additionalData?: Record<string, any> | undefined;
}

export interface ErrorFingerprint {
  id: string;
  type: string;
  message: string;
  stack: string;
  component?: string | undefined;
  hash: string;
}

export interface ErrorStats {
  totalErrors: number;
  uniqueErrors: number;
  errorRate: number;
  topErrors: Array<{
    fingerprint: string;
    count: number;
    lastSeen: Date;
    message: string;
  }>;
  errorsByComponent: Record<string, number>;
  errorsByType: Record<string, number>;
  recentErrors: number;
}

export interface NotificationChannel {
  type: 'slack' | 'email' | 'webhook';
  config: {
    url?: string;
    email?: string;
    threshold?: number;
    cooldown?: number;
  };
  enabled: boolean;
}

export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private prisma: PrismaClient;
  private redis: RedisService;
  private notificationChannels: NotificationChannel[] = [];
  private errorBuffer: Array<{ fingerprint: ErrorFingerprint; context: ErrorContext }> = [];
  private flushInterval?: NodeJS.Timeout;

  private constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
    this.setupNotificationChannels();
    this.startErrorBufferFlush();
  }

  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  /**
   * Capture and track an error with full context
   */
  public async captureError(
    error: Error,
    context: Partial<ErrorContext> = {},
    req?: Request
  ): Promise<string> {
    try {
      // Build complete context
      const fullContext: ErrorContext = {
        ...this.extractRequestContext(req),
        ...context,
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      };

      // Create error fingerprint
      const fingerprint = this.createErrorFingerprint(error, fullContext);

      // Add to buffer for batch processing
      this.errorBuffer.push({ fingerprint, context: fullContext });

      // Check for immediate notifications (critical errors)
      await this.checkCriticalError(fingerprint, fullContext);

      // Update real-time metrics
      await this.updateErrorMetrics(fingerprint);

      logger.error('Error captured', {
        fingerprint: fingerprint.id,
        message: error.message,
        userId: fullContext.userId,
        component: fullContext.component,
        url: fullContext.url
      });

      return fingerprint.id;

    } catch (trackingError) {
      // Never let error tracking break the application
      logger.error('Error tracking failed', {
        originalError: error.message,
        trackingError: (trackingError as Error).message
      });
      return 'tracking-failed';
    }
  }

  /**
   * Capture performance issue
   */
  public async capturePerformanceIssue(
    operation: string,
    duration: number,
    threshold: number,
    context: Partial<ErrorContext> = {}
  ): Promise<void> {
    if (duration > threshold) {
      const performanceError = new Error(
        `Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`
      );
      performanceError.name = 'PerformanceIssue';

      await this.captureError(performanceError, {
        ...context,
        component: 'performance',
        operation,
        additionalData: {
          duration,
          threshold,
          slowQuery: duration > threshold * 2
        }
      });
    }
  }

  /**
   * Create unique fingerprint for error grouping
   */
  private createErrorFingerprint(error: Error, context: ErrorContext): ErrorFingerprint {
    // Normalize stack trace for consistent grouping
    const normalizedStack = this.normalizeStackTrace(error.stack || '');
    
    // Create hash for grouping similar errors
    const hashInput = `${error.name}:${error.message}:${normalizedStack}:${context.component || 'unknown'}`;
    const hash = crypto.createHash('md5').update(hashInput).digest('hex');

    return {
      id: crypto.randomUUID(),
      type: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      component: context.component,
      hash
    };
  }

  /**
   * Normalize stack trace for better grouping
   */
  private normalizeStackTrace(stack: string): string {
    return stack
      .split('\n')
      .map(line => {
        // Remove file paths and line numbers for grouping
        return line
          .replace(/\(.*:\d+:\d+\)/g, '(file:line:col)')
          .replace(/at .*:\d+:\d+/g, 'at file:line:col')
          .replace(/\/.*\//g, '/path/');
      })
      .slice(0, 10) // Keep only top 10 stack frames
      .join('\n');
  }

  /**
   * Extract context from Express request
   */
  private extractRequestContext(req?: Request): Partial<ErrorContext> {
    if (!req) return {};

    // Get user info if available
    const user = (req as any).user;
    const sessionInfo = (req as any).sessionInfo;

    return {
      userId: user?.id,
      sessionId: sessionInfo?.sessionId,
      requestId: req.headers['x-request-id'] as string,
      userAgent: req.get('User-Agent') || undefined,
      ipAddress: req.ip || req.connection.remoteAddress || undefined,
      url: req.originalUrl || req.url,
      method: req.method,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
      query: req.query as Record<string, any>,
      params: req.params
    };
  }

  /**
   * Sanitize sensitive data from headers
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize sensitive data from request body
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Check if error requires immediate notification
   */
  private async checkCriticalError(
    fingerprint: ErrorFingerprint,
    context: ErrorContext
  ): Promise<void> {
    const isCritical = 
      fingerprint.type === 'DatabaseError' ||
      fingerprint.type === 'SecurityError' ||
      fingerprint.message.includes('CRITICAL') ||
      context.component === 'payment';

    if (isCritical) {
      await this.sendImmediateNotification(fingerprint, context);
    }

    // Check error frequency
    const recentErrorCount = await this.getRecentErrorCount(fingerprint.hash);
    if (recentErrorCount > 10) { // More than 10 occurrences in recent time
      await this.sendFrequencyAlert(fingerprint, recentErrorCount);
    }
  }

  /**
   * Update error metrics in Redis
   */
  private async updateErrorMetrics(fingerprint: ErrorFingerprint): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    await Promise.all([
      // Increment total error count
      this.redis.incr(`errors:total:${today}`),
      
      // Increment hourly error count
      this.redis.incr(`errors:hourly:${today}:${hour}`),
      
      // Increment error type count
      this.redis.incr(`errors:type:${fingerprint.type}:${today}`),
      
      // Increment component error count
      fingerprint.component && this.redis.incr(`errors:component:${fingerprint.component}:${today}`),
      
      // Track unique error hash
      this.redis.sadd(`errors:unique:${today}`, fingerprint.hash),
      
      // Update recent error count for this hash
      this.redis.incr(`errors:hash:${fingerprint.hash}:recent`),
      this.redis.expire(`errors:hash:${fingerprint.hash}:recent`, 3600) // 1 hour TTL
    ]);
  }

  /**
   * Get recent error count for a specific error hash
   */
  private async getRecentErrorCount(hash: string): Promise<number> {
    const count = await this.redis.get(`errors:hash:${hash}:recent`);
    return count ? parseInt(count) : 0;
  }

  /**
   * Start periodic error buffer flush
   */
  private startErrorBufferFlush(): void {
    this.flushInterval = setInterval(async () => {
      await this.flushErrorBuffer();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Flush error buffer to database
   */
  private async flushErrorBuffer(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    const errors = [...this.errorBuffer];
    this.errorBuffer = []; // Clear buffer

    try {
      // Group errors by hash for batch processing
      const errorGroups = new Map<string, typeof errors>();
      
      for (const error of errors) {
        const hash = error.fingerprint.hash;
        if (!errorGroups.has(hash)) {
          errorGroups.set(hash, []);
        }
        errorGroups.get(hash)!.push(error);
      }

      // Process each error group
      for (const [hash, groupErrors] of errorGroups) {
        await this.processErrorGroup(hash, groupErrors);
      }

      logger.debug(`Flushed ${errors.length} errors to database`);

    } catch (error) {
      logger.error('Failed to flush error buffer', error);
      // Re-add errors to buffer for retry
      this.errorBuffer.unshift(...errors);
    }
  }

  /**
   * Process a group of similar errors
   */
  private async processErrorGroup(
    hash: string,
    errors: Array<{ fingerprint: ErrorFingerprint; context: ErrorContext }>
  ): Promise<void> {
    const firstError = errors[0];
    const lastError = errors[errors.length - 1];

    try {
      // Check if error group already exists
      const existingGroup = await this.prisma.errorLog.findFirst({
        where: { errorCode: hash }
      });

      if (existingGroup) {
        // Update existing error group
        await this.prisma.errorLog.update({
          where: { id: existingGroup.id },
          data: {
            // Increment occurrence count
            // Add latest context
            details: {
              ...existingGroup.details,
              occurrences: (existingGroup.details as any)?.occurrences + errors.length || errors.length,
              lastOccurrence: lastError.context.timestamp,
              recentContexts: errors.slice(-5).map(e => e.context) // Keep last 5 contexts
            }
          }
        });
      } else {
        // Create new error group
        await this.prisma.errorLog.create({
          data: {
            errorType: firstError.fingerprint.type,
            errorMessage: firstError.fingerprint.message,
            errorStack: firstError.fingerprint.stack,
            errorCode: hash,
            component: firstError.fingerprint.component || 'unknown',
            operation: firstError.context.operation || 'unknown',
            ipAddress: firstError.context.ipAddress,
            userAgent: firstError.context.userAgent,
            severity: this.calculateSeverity(firstError.fingerprint, firstError.context),
            status: 'new',
            details: {
              occurrences: errors.length,
              firstOccurrence: firstError.context.timestamp,
              lastOccurrence: lastError.context.timestamp,
              contexts: errors.map(e => e.context),
              environment: firstError.context.environment,
              version: firstError.context.version
            }
          }
        });
      }

    } catch (dbError) {
      logger.error('Failed to save error group to database', {
        hash,
        errorCount: errors.length,
        dbError: (dbError as Error).message
      });
    }
  }

  /**
   * Calculate error severity
   */
  private calculateSeverity(fingerprint: ErrorFingerprint, context: ErrorContext): string {
    if (fingerprint.type === 'SecurityError' || context.component === 'auth') {
      return 'critical';
    }
    
    if (fingerprint.type === 'DatabaseError' || context.component === 'payment') {
      return 'error';
    }
    
    if (fingerprint.type === 'PerformanceIssue') {
      return 'warning';
    }
    
    return 'info';
  }

  /**
   * Setup notification channels
   */
  private setupNotificationChannels(): void {
    // Slack notifications
    if (process.env.SLACK_WEBHOOK_URL) {
      this.notificationChannels.push({
        type: 'slack',
        config: {
          url: process.env.SLACK_WEBHOOK_URL,
          threshold: 5, // Notify after 5 occurrences
          cooldown: 300 // 5 minutes cooldown
        },
        enabled: true
      });
    }

    // Email notifications
    if (process.env.ERROR_NOTIFICATION_EMAIL) {
      this.notificationChannels.push({
        type: 'email',
        config: {
          email: process.env.ERROR_NOTIFICATION_EMAIL,
          threshold: 10,
          cooldown: 600 // 10 minutes cooldown
        },
        enabled: true
      });
    }
  }

  /**
   * Send immediate notification for critical errors
   */
  private async sendImmediateNotification(
    fingerprint: ErrorFingerprint,
    context: ErrorContext
  ): Promise<void> {
    const message = `🚨 Critical Error Detected\n` +
      `Type: ${fingerprint.type}\n` +
      `Message: ${fingerprint.message}\n` +
      `Component: ${context.component || 'unknown'}\n` +
      `Environment: ${context.environment}\n` +
      `Time: ${context.timestamp.toISOString()}`;

    await this.sendNotifications(message, 'critical');
  }

  /**
   * Send frequency alert
   */
  private async sendFrequencyAlert(
    fingerprint: ErrorFingerprint,
    count: number
  ): Promise<void> {
    const message = `⚠️ High Error Frequency\n` +
      `Error: ${fingerprint.message}\n` +
      `Occurrences: ${count} in the last hour\n` +
      `Type: ${fingerprint.type}`;

    await this.sendNotifications(message, 'frequency');
  }

  /**
   * Send notifications to all enabled channels
   */
  private async sendNotifications(message: string, _type: string): Promise<void> {
    for (const channel of this.notificationChannels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'slack':
            await this.sendSlackNotification(message, channel.config.url!);
            break;
          case 'email':
            await this.sendEmailNotification(message, channel.config.email!);
            break;
          case 'webhook':
            await this.sendWebhookNotification(message, channel.config.url!);
            break;
        }
      } catch (error) {
        logger.error(`Failed to send ${channel.type} notification`, error);
      }
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(message: string, webhookUrl: string): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        username: 'Vevurn POS Error Bot',
        icon_emoji: ':warning:'
      })
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send email notification (placeholder - implement with your email service)
   */
  private async sendEmailNotification(message: string, email: string): Promise<void> {
    // Implement with your email service (SendGrid, AWS SES, etc.)
    logger.info('Email notification would be sent', { email, message });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(message: string, url: string): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, timestamp: new Date().toISOString() })
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  /**
   * Get error statistics
   */
  public async getErrorStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<ErrorStats> {
    const now = new Date();
    const periods = this.getTimePeriods(now, timeframe);

    try {
      // Get basic stats from Redis
      const totalErrors = await this.sumRedisCounters(periods.map(p => `errors:total:${p}`));
      const uniqueErrors = await this.getUniqueErrorCount(periods);

      // Calculate error rate (errors per hour)
      const hours = timeframe === 'hour' ? 1 : timeframe === 'day' ? 24 : 168;
      const errorRate = totalErrors / hours;

      // Get top errors from database
      const topErrors = await this.getTopErrors(timeframe);

      // Get errors by component and type
      const errorsByComponent = await this.getErrorsByDimension('component', periods);
      const errorsByType = await this.getErrorsByDimension('type', periods);

      // Get recent errors (last hour)
      const recentErrors = await this.sumRedisCounters([`errors:total:${this.getDateString(now)}`]);

      return {
        totalErrors,
        uniqueErrors,
        errorRate: Math.round(errorRate * 100) / 100,
        topErrors,
        errorsByComponent,
        errorsByType,
        recentErrors
      };

    } catch (error) {
      logger.error('Failed to get error stats', error);
      return {
        totalErrors: 0,
        uniqueErrors: 0,
        errorRate: 0,
        topErrors: [],
        errorsByComponent: {},
        errorsByType: {},
        recentErrors: 0
      };
    }
  }

  /**
   * Helper methods for statistics
   */
  private getTimePeriods(now: Date, timeframe: string): string[] {
    const periods: string[] = [];
    const days = timeframe === 'hour' ? 1 : timeframe === 'day' ? 1 : 7;

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      periods.push(this.getDateString(date));
    }

    return periods;
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private async sumRedisCounters(keys: string[]): Promise<number> {
    let total = 0;
    for (const key of keys) {
      const value = await this.redis.get(key);
      total += value ? parseInt(value) : 0;
    }
    return total;
  }

  private async getUniqueErrorCount(periods: string[]): Promise<number> {
    const allHashes = new Set<string>();
    for (const period of periods) {
      const hashes = await this.redis.smembers(`errors:unique:${period}`);
      hashes.forEach((hash: string) => allHashes.add(hash));
    }
    return allHashes.size;
  }

  private async getTopErrors(timeframe: string): Promise<ErrorStats['topErrors']> {
    const since = new Date();
    since.setHours(since.getHours() - (timeframe === 'hour' ? 1 : timeframe === 'day' ? 24 : 168));

    const errors = await this.prisma.errorLog.findMany({
      where: {
        createdAt: { gte: since }
      },
      select: {
        errorCode: true,
        errorMessage: true,
        details: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    return errors.map((error: any) => ({
      fingerprint: error.errorCode || 'unknown',
      count: (error.details as any)?.occurrences || 1,
      lastSeen: error.updatedAt,
      message: error.errorMessage
    }));
  }

  private async getErrorsByDimension(
    dimension: 'component' | 'type',
    periods: string[]
  ): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    
    for (const period of periods) {
      const pattern = `errors:${dimension}:*:${period}`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const value = await this.redis.get(key);
        const dimensionValue = key.split(':')[2]; // Extract component/type name
        result[dimensionValue] = (result[dimensionValue] || 0) + (value ? parseInt(value) : 0);
      }
    }
    
    return result;
  }

  /**
   * Clean up old error data
   */
  public async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Flush remaining errors
    await this.flushErrorBuffer();

    logger.info('Error tracking service cleaned up');
  }
}
