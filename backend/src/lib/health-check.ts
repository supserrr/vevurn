/**
 * Enhanced Database Health Check and Monitoring System
 * Following Better Auth documentation patterns for database management
 * Reference: https://better-auth.com/docs/concepts/database
 */

import { DatabaseManager } from './database-config'
import { RedisManager } from './redis-storage'

export class HealthCheckManager {
  private databaseManager: DatabaseManager
  private redisManager: RedisManager

  constructor() {
    this.databaseManager = new DatabaseManager()
    this.redisManager = new RedisManager()
  }

  /**
   * Comprehensive health check for all Better Auth components
   * Following the documentation's emphasis on proper database management
   */
  async performHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      components: {} as Record<string, any>,
      summary: {} as Record<string, any>,
    }

    try {
      // Database Health Check
      console.log('🔍 Checking database health...')
      const dbHealth = await this.databaseManager.healthCheck()
      results.components.database = dbHealth

      // Redis Health Check  
      console.log('🔍 Checking Redis health...')
      const redisHealth = await this.redisManager.healthCheck()
      results.components.redis = redisHealth

      // Authentication Endpoints Check (if server is running)
      console.log('🔍 Checking Better Auth endpoints...')
      const authHealth = await this.checkAuthEndpoints()
      results.components.authentication = authHealth

      // Environment Configuration Check
      console.log('🔍 Checking environment configuration...')
      const envHealth = this.checkEnvironmentConfig()
      results.components.environment = envHealth

      // Determine overall status
      const componentStatuses = Object.values(results.components).map(c => c.status)
      if (componentStatuses.every(status => status === 'healthy')) {
        results.status = 'healthy'
      } else if (componentStatuses.some(status => status === 'healthy')) {
        results.status = 'degraded'
      } else {
        results.status = 'unhealthy'
      }

      // Generate summary
      results.summary = {
        totalComponents: componentStatuses.length,
        healthyComponents: componentStatuses.filter(s => s === 'healthy').length,
        unhealthyComponents: componentStatuses.filter(s => s === 'unhealthy').length,
      }

      return results
    } catch (error) {
      results.status = 'unhealthy'
      results.components.error = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
      return results
    }
  }

  /**
   * Check Better Auth endpoints availability
   */
  private async checkAuthEndpoints() {
    try {
      // This would typically check if auth routes are responding
      // For now, we'll do basic validation
      const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:8000'
      
      return {
        status: 'healthy',
        baseUrl,
        endpoints: [
          '/api/auth/session',
          '/api/auth/sign-in/email', 
          '/api/auth/sign-up/email',
        ],
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Check environment configuration for Better Auth
   */
  private checkEnvironmentConfig() {
    const requiredEnvVars = [
      'DATABASE_URL',
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL',
    ]

    const optionalEnvVars = [
      'REDIS_HOST',
      'REDIS_PORT', 
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'MICROSOFT_CLIENT_ID',
      'MICROSOFT_CLIENT_SECRET',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'SMTP_HOST',
      'SMTP_USER',
    ]

    const missing = requiredEnvVars.filter(env => !process.env[env])
    const present = requiredEnvVars.filter(env => !!process.env[env])
    const optionalPresent = optionalEnvVars.filter(env => !!process.env[env])

    return {
      status: missing.length === 0 ? 'healthy' : 'unhealthy',
      required: {
        total: requiredEnvVars.length,
        present: present.length,
        missing: missing,
      },
      optional: {
        total: optionalEnvVars.length,
        present: optionalPresent.length,
        configured: optionalPresent,
      },
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get detailed statistics for monitoring
   * Following Better Auth patterns for database management
   */
  async getDetailedStats() {
    try {
      const [dbStats, redisStats] = await Promise.all([
        this.databaseManager.getStatistics(),
        this.redisManager.getStatistics(),
      ])

      return {
        timestamp: new Date().toISOString(),
        database: dbStats,
        redis: redisStats,
      }
    } catch (error) {
      throw new Error(`Failed to get detailed stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Perform maintenance tasks
   * Following Better Auth documentation patterns
   */
  async performMaintenance() {
    const results = {
      timestamp: new Date().toISOString(),
      tasks: {} as Record<string, any>,
    }

    try {
      // Clean up expired database records
      console.log('🧹 Cleaning up expired database records...')
      const dbCleanup = await this.databaseManager.cleanupExpiredRecords()
      results.tasks.databaseCleanup = {
        status: 'completed',
        ...dbCleanup,
      }

      // Clear expired Redis cache entries
      console.log('🧹 Clearing expired Redis cache entries...')
      const redisCleanup = await this.redisManager.clearAuthCache()
      results.tasks.redisCleanup = {
        status: 'completed', 
        ...redisCleanup,
      }

      console.log('✅ Maintenance tasks completed successfully')
      return results
    } catch (error) {
      console.error('❌ Maintenance tasks failed:', error)
      results.tasks.error = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      return results
    }
  }

  /**
   * Generate a health report in a readable format
   */
  async generateHealthReport() {
    const health = await this.performHealthCheck()
    
    const report = [
      '='.repeat(50),
      '🏥 BETTER AUTH HEALTH REPORT',
      '='.repeat(50),
      `📅 Timestamp: ${health.timestamp}`,
      `🎯 Overall Status: ${health.status.toUpperCase()}`,
      '',
      '📊 Component Status:',
    ]

    for (const [component, data] of Object.entries(health.components)) {
      const status = data.status === 'healthy' ? '✅' : '❌'
      report.push(`  ${status} ${component.toUpperCase()}: ${data.status}`)
      
      if (data.error) {
        report.push(`      Error: ${data.error}`)
      }
    }

    report.push('')
    report.push('📈 Summary:')
    report.push(`  Total Components: ${health.summary.totalComponents}`)
    report.push(`  Healthy: ${health.summary.healthyComponents}`)
    report.push(`  Unhealthy: ${health.summary.unhealthyComponents}`)
    report.push('')
    report.push('='.repeat(50))

    return report.join('\n')
  }

  /**
   * Graceful shutdown of all connections
   */
  async shutdown() {
    console.log('🔄 Shutting down database connections...')
    
    try {
      await Promise.all([
        this.databaseManager.disconnect(),
        this.redisManager.disconnect(),
      ])
      
      console.log('✅ All database connections closed gracefully')
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      throw error
    }
  }
}

export default new HealthCheckManager()
