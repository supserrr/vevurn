// Enhanced Database Connection Pool Service
// File: backend/src/services/DatabasePoolService.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
  retryAttempts: number;
  retryDelay: number;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  errorRate: number;
  lastHealthCheck: Date;
}

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class DatabasePoolService {
  private static instance: DatabasePoolService;
  private prisma: PrismaClient;
  private config: DatabaseConfig;
  private metrics: ConnectionMetrics;
  private queryLog: QueryMetrics[] = [];
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private healthy: boolean = true;
  
  private constructor() {
    this.config = this.loadConfig();
    this.metrics = this.initializeMetrics();
    this.prisma = this.createPrismaClient();
    this.setupMonitoring();
  }

  public static getInstance(): DatabasePoolService {
    if (!DatabasePoolService.instance) {
      DatabasePoolService.instance = new DatabasePoolService();
    }
    return DatabasePoolService.instance;
  }

  private loadConfig(): DatabaseConfig {
    return {
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // 10 seconds
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '600000'), // 10 minutes
      maxLifetime: parseInt(process.env.DB_MAX_LIFETIME || '3600000'), // 1 hour
      retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000') // 1 second
    };
  }

  private initializeMetrics(): ConnectionMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      errorRate: 0,
      lastHealthCheck: new Date()
    };
  }

  private createPrismaClient(): PrismaClient {
    const databaseUrl = new URL(process.env.DATABASE_URL!);
    
    // Add connection pool parameters to the URL
    databaseUrl.searchParams.set('connection_limit', this.config.maxConnections.toString());
    databaseUrl.searchParams.set('pool_timeout', Math.floor(this.config.connectionTimeout / 1000).toString());
    databaseUrl.searchParams.set('schema', 'public');
    
    const client = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl.toString()
        }
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' }
      ],
      errorFormat: 'pretty'
    });

    // Set up query logging and monitoring
    client.$on('query', (event: Prisma.QueryEvent) => {
      const queryMetric: QueryMetrics = {
        query: event.query.substring(0, 100) + (event.query.length > 100 ? '...' : ''),
        duration: event.duration,
        timestamp: new Date(),
        success: true
      };

      this.queryLog.push(queryMetric);
      this.updateQueryMetrics(queryMetric);

      // Log slow queries
      if (event.duration > 1000) { // Queries taking more than 1 second
        logger.warn('Slow query detected', {
          query: event.query,
          duration: event.duration,
          params: event.params
        });
        this.metrics.slowQueries++;
      }

      // Keep only last 1000 queries in memory
      if (this.queryLog.length > 1000) {
        this.queryLog = this.queryLog.slice(-1000);
      }
    });

    client.$on('error', (event) => {
      logger.error('Prisma error', event);
      this.updateErrorMetrics();
    });

    client.$on('info', (event) => {
      logger.info('Prisma info', event);
    });

    client.$on('warn', (event) => {
      logger.warn('Prisma warning', event);
    });

    return client;
  }

  private setupMonitoring(): void {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);

    // Metrics update every 60 seconds
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
      this.logMetrics();
    }, 60000);

    // Cleanup old query logs every 5 minutes
    setInterval(() => {
      this.cleanupQueryLogs();
    }, 5 * 60 * 1000);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Simple health check query
      await this.executeWithRetry(async () => {
        return await this.prisma.$queryRaw`SELECT 1 as health_check`;
      });

      const responseTime = Date.now() - startTime;
      this.metrics.lastHealthCheck = new Date();
      this.healthy = true;

      if (responseTime > 5000) { // Health check taking more than 5 seconds
        logger.warn('Database health check slow', { responseTime });
      }

      logger.debug('Database health check passed', { responseTime });

    } catch (error) {
      this.healthy = false;
      logger.error('Database health check failed', error);
      
      // Attempt to reconnect
      await this.reconnect();
    }
  }

  private updateQueryMetrics(_queryMetric: QueryMetrics): void {
    const recentQueries = this.queryLog.slice(-100); // Last 100 queries
    
    if (recentQueries.length > 0) {
      const totalTime = recentQueries.reduce((sum, q) => sum + q.duration, 0);
      this.metrics.averageQueryTime = totalTime / recentQueries.length;
    }
  }

  private updateErrorMetrics(): void {
    const recentQueries = this.queryLog.slice(-100);
    const errorCount = recentQueries.filter(q => !q.success).length;
    this.metrics.errorRate = recentQueries.length > 0 ? (errorCount / recentQueries.length) * 100 : 0;
  }

  private updateMetrics(): void {
    // This would ideally query the database connection pool statistics
    // For now, we'll estimate based on query patterns
    const recentQueries = this.queryLog.slice(-60); // Last minute of queries
    this.metrics.activeConnections = Math.min(recentQueries.length, this.config.maxConnections);
    this.metrics.totalConnections = this.config.maxConnections;
    this.metrics.idleConnections = this.config.maxConnections - this.metrics.activeConnections;
  }

  private logMetrics(): void {
    logger.info('Database pool metrics', {
      totalConnections: this.metrics.totalConnections,
      activeConnections: this.metrics.activeConnections,
      idleConnections: this.metrics.idleConnections,
      averageQueryTime: Math.round(this.metrics.averageQueryTime),
      slowQueries: this.metrics.slowQueries,
      errorRate: this.metrics.errorRate.toFixed(2) + '%',
      isHealthy: this.healthy
    });
  }

  private cleanupQueryLogs(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    this.queryLog = this.queryLog.filter(q => q.timestamp > fiveMinutesAgo);
  }

  private async reconnect(): Promise<void> {
    try {
      logger.info('Attempting to reconnect to database...');
      await this.prisma.$disconnect();
      await this.prisma.$connect();
      logger.info('Database reconnection successful');
    } catch (error) {
      logger.error('Database reconnection failed', error);
    }
  }

  // Public methods for database operations with retry logic

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;

        // Log successful query
        this.queryLog.push({
          query: 'operation',
          duration,
          timestamp: new Date(),
          success: true
        });

        return result;

      } catch (error) {
        lastError = error as Error;
        
        // Log failed query
        this.queryLog.push({
          query: 'operation',
          duration: 0,
          timestamp: new Date(),
          success: false,
          error: lastError.message
        });

        logger.warn(`Database operation failed (attempt ${attempt + 1}/${retries + 1})`, {
          error: lastError.message,
          attempt: attempt + 1
        });

        // Don't retry on certain errors
        if (this.shouldNotRetry(lastError)) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private shouldNotRetry(error: Error): boolean {
    // Don't retry on syntax errors, constraint violations, etc.
    const nonRetryableErrors = [
      'P2002', // Unique constraint violation
      'P2003', // Foreign key constraint violation
      'P2004', // Constraint violation
      'P2025', // Record not found
      'P2001'  // Record does not exist
    ];

    return nonRetryableErrors.some(code => error.message.includes(code));
  }

  // Public API methods

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public isHealthy(): boolean {
    return this.healthy;
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public async getDetailedMetrics(): Promise<any> {
    try {
      // Get database-specific metrics
      const dbSize = await this.prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
      `;

      const connectionStats = await this.prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database();
      `;

      const lockStats = await this.prisma.$queryRaw`
        SELECT 
          mode,
          count(*) as lock_count
        FROM pg_locks 
        WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
        GROUP BY mode;
      `;

      return {
        poolMetrics: this.metrics,
        databaseSize: dbSize,
        connectionStats,
        lockStats,
        recentQueries: this.queryLog.slice(-10),
        config: this.config
      };

    } catch (error) {
      logger.error('Failed to get detailed metrics', error);
      return {
        poolMetrics: this.metrics,
        error: 'Failed to fetch database metrics'
      };
    }
  }

  public async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    try {
      await this.prisma.$disconnect();
      logger.info('Database connection pool disconnected');
    } catch (error) {
      logger.error('Error disconnecting database pool', error);
    }
  }

  // Transaction wrapper with retry logic
  public async transaction<T>(
    operations: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    return await this.executeWithRetry(async () => {
      const transactionOptions: any = {
        maxWait: options?.maxWait || 5000,
        timeout: options?.timeout || 10000
      };
      
      if (options?.isolationLevel) {
        transactionOptions.isolationLevel = options.isolationLevel;
      }
      
      return await this.prisma.$transaction(operations, transactionOptions);
    });
  }

  // Batch operations with optimization
  public async batchExecute<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(op => this.executeWithRetry(op))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  // Connection warm-up for startup
  public async warmUp(): Promise<void> {
    logger.info('Warming up database connection pool...');
    
    try {
      // Create initial connections
      const warmUpPromises = Array.from({ length: this.config.minConnections }, async (_, i) => {
        return await this.executeWithRetry(async () => {
          return await this.prisma.$queryRaw`SELECT ${i} as connection_warmup`;
        });
      });

      await Promise.all(warmUpPromises);
      logger.info(`Database pool warmed up with ${this.config.minConnections} connections`);
      
    } catch (error) {
      logger.error('Database pool warm-up failed', error);
      throw error;
    }
  }
}
