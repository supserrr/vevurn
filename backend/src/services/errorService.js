// =============================================
// ERROR HANDLING SERVICE
// =============================================

import { db } from '../database/database.js';

export class ErrorService {
  static async logError(error, context = {}) {
    try {
      const errorData = {
        error_type: error.name || 'Unknown',
        error_message: error.message,
        error_stack: error.stack,
        error_code: error.code,
        component: context.component || 'unknown',
        operation: context.operation || 'unknown',
        endpoint: context.endpoint,
        user_id: context.user_id,
        session_id: context.session_id,
        request_id: context.request_id,
        ip_address: context.ip_address,
        user_agent: context.user_agent,
        severity: this.determineSeverity(error),
        created_at: new Date()
      };

      await db.prisma.errorLogs.create({ data: errorData });

      if (errorData.severity === 'critical') {
        await this.sendCriticalAlert(errorData);
      }

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      console.error('Original error:', error);
    }
  }

  static determineSeverity(error) {
    if (error.name === 'DatabaseError') return 'critical';
    if (error.name === 'PaymentError') return 'critical';
    if (error.message?.includes('transaction')) return 'high';
    if (error.name === 'ValidationError') return 'warning';
    if (error.name === 'NotFoundError') return 'info';
    return 'error';
  }

  static async logPerformanceMetric(metric) {
    try {
      await db.prisma.performanceMetrics.create({
        data: {
          metric_type: metric.type,
          operation: metric.operation,
          duration_ms: metric.duration,
          memory_usage_mb: metric.memory,
          cpu_usage_percent: metric.cpu,
          endpoint: metric.endpoint,
          method: metric.method,
          status_code: metric.statusCode,
          user_id: metric.userId,
          session_id: metric.sessionId,
          metadata: metric.metadata || {},
          created_at: new Date()
        }
      });

      if (metric.duration > 5000) {
        await this.sendSlowOperationAlert(metric);
      }
    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }

  static async sendCriticalAlert(errorData) {
    console.error('🚨 CRITICAL ERROR ALERT:', errorData);
    
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Critical Error in Vevurn POS`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Error Type', value: errorData.error_type, short: true },
                { title: 'Component', value: errorData.component, short: true },
                { title: 'Message', value: errorData.error_message, short: false },
                { title: 'User', value: errorData.user_id || 'Unknown', short: true },
                { title: 'Time', value: new Date().toISOString(), short: true }
              ]
            }]
          })
        });
      } catch (slackError) {
        console.error('Failed to send Slack alert:', slackError);
      }
    }
  }

  static async sendSlowOperationAlert(metric) {
    console.warn('⚠️ Slow operation detected:', metric);
  }
}
