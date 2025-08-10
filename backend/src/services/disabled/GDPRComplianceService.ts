import { PrismaClient } from '@prisma/client';
import { RedisService } from './RedisService';
import { EmailService } from './EmailService';
import ExportService from './ExportService';
import { s3Service } from './S3Service';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';
import * as archiver from 'archiver';

const prisma = new PrismaClient();
const redis = new RedisService();
const emailService = EmailService.getInstance();
const exportService = ExportService.getInstance();

interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

interface DataDeletionRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  scheduledFor: Date; // 30 days after request
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  reason?: string;
  confirmedAt?: Date;
  completedAt?: Date;
}

interface AuditRetentionPolicy {
  category: string;
  retentionDays: number;
  autoDelete: boolean;
  compressAfterDays?: number;
  archiveLocation?: string;
}

interface ConsentRecord {
  id: string;
  userId: string;
  type: 'marketing' | 'analytics' | 'cookies' | 'data_processing';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string; // Version of terms/policy
}

export class GDPRComplianceService {
  private static instance: GDPRComplianceService;
  private encryptionKey: Buffer;

  static getInstance(): GDPRComplianceService {
    if (!this.instance) {
      this.instance = new GDPRComplianceService();
    }
    return this.instance;
  }

  constructor() {
    // Initialize encryption key from environment or generate
    const key = process.env.GDPR_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(key, 'hex');
    
    // Start automated retention jobs
    this.initializeRetentionJobs();
  }

  /**
   * Handle data export request (GDPR Article 20 - Right to data portability)
   */
  async requestDataExport(userId: string, email: string): Promise<DataExportRequest> {
    try {
      const requestId = crypto.randomUUID();
      
      // Create export request record
      const request: DataExportRequest = {
        id: requestId,
        userId,
        requestedAt: new Date(),
        status: 'pending'
      };

      // Store request in database
      await prisma.setting.create({
        data: {
          key: `data_export_${requestId}`,
          value: JSON.stringify(request),
          category: 'gdpr_requests'
        }
      });

      // Process export asynchronously
      this.processDataExport(requestId, userId, email).catch(error => {
        logger.error(`Failed to process data export for user ${userId}:`, error);
      });

      return request;
    } catch (error) {
      logger.error('Error creating data export request:', error);
      throw error;
    }
  }

  /**
   * Process data export for a user
   */
  private async processDataExport(requestId: string, userId: string, email: string): Promise<void> {
    try {
      // Update status to processing
      await this.updateExportRequestStatus(requestId, 'processing');

      // Gather all user data
      const userData = await this.gatherUserData(userId);

      // Create ZIP archive with all data
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      const chunks: Buffer[] = [];
      archive.on('data', chunk => chunks.push(chunk));

      // Add user profile data
      archive.append(JSON.stringify(userData.profile, null, 2), {
        name: 'profile.json'
      });

      // Add sales history
      if (userData.sales.length > 0) {
        const salesCSV = await exportService.exportToCSV({
          format: 'csv',
          type: 'sales',
          filters: { customerId: userId }
        });
        archive.append(salesCSV, { name: 'sales_history.csv' });
      }

      // Add customer interactions
      archive.append(JSON.stringify(userData.interactions, null, 2), {
        name: 'interactions.json'
      });

      // Add consent records
      archive.append(JSON.stringify(userData.consents, null, 2), {
        name: 'consent_records.json'
      });

      // Add audit logs
      archive.append(JSON.stringify(userData.auditLogs, null, 2), {
        name: 'audit_logs.json'
      });

      await archive.finalize();
      const zipBuffer = Buffer.concat(chunks);

      // Encrypt the archive
      const encryptedData = this.encryptData(zipBuffer);
      
      // Upload to secure storage
      const filename = `gdpr_export_${userId}_${Date.now()}.zip.enc`;
      const s3Result = await s3Service.uploadFile(
        encryptedData,
        filename,
        {
          folder: 'gdpr-exports',
          contentType: 'application/octet-stream'
        }
      );

      // Generate time-limited download URL (48 hours)
      const downloadUrl = await s3Service.getSignedUrl(s3Result.key, 172800);

      // Update request status
      await this.updateExportRequestStatus(requestId, 'completed', {
        downloadUrl,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 172800000) // 48 hours
      });

      // Send email with download link
      await emailService.sendEmail({
        to: email,
        subject: 'Your Data Export is Ready',
        html: this.getDataExportEmailTemplate(downloadUrl)
      });

      logger.info(`Data export completed for user ${userId}`);
    } catch (error) {
      await this.updateExportRequestStatus(requestId, 'failed');
      throw error;
    }
  }

  /**
   * Handle data deletion request (GDPR Article 17 - Right to erasure)
   */
  async requestDataDeletion(
    userId: string,
    reason?: string,
    immediate: boolean = false
  ): Promise<DataDeletionRequest> {
    try {
      const requestId = crypto.randomUUID();
      const scheduledFor = immediate ? new Date() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const request: DataDeletionRequest = {
        id: requestId,
        userId,
        requestedAt: new Date(),
        scheduledFor,
        status: immediate ? 'scheduled' : 'pending',
        reason
      };

      // Store deletion request
      await prisma.setting.create({
        data: {
          key: `data_deletion_${requestId}`,
          value: JSON.stringify(request),
          category: 'gdpr_requests'
        }
      });

      // Send confirmation email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Data Deletion Request Received',
          html: this.getDataDeletionEmailTemplate(request)
        });
      }

      // Schedule deletion if confirmed
      if (immediate || request.status === 'scheduled') {
        this.scheduleDataDeletion(request);
      }

      return request;
    } catch (error) {
      logger.error('Error creating data deletion request:', error);
      throw error;
    }
  }

  /**
   * Execute data deletion for a user
   */
  private async executeDataDeletion(userId: string): Promise<void> {
    try {
      logger.info(`Starting data deletion for user ${userId}`);

      // Start transaction for atomic deletion
      await prisma.$transaction(async (tx) => {
        // Anonymize sales records instead of deleting (for legal compliance)
        await tx.sale.updateMany({
          where: { customerId: userId },
          data: {
            customerId: null,
            customerPhone: 'DELETED',
            // Keep financial data for tax purposes but remove PII
          }
        });

        // Delete or anonymize other records
        await tx.customer.update({
          where: { id: userId },
          data: {
            name: `DELETED_USER_${crypto.randomBytes(4).toString('hex')}`,
            email: null,
            phone: 'DELETED',
            address: null,
            // Keep transaction counts for analytics but remove PII
          }
        });

        // Delete user account if customer is also a user
        const user = await tx.user.findFirst({
          where: { email: (await tx.customer.findUnique({ where: { id: userId } }))?.email || '' }
        });

        if (user) {
          // Delete sessions
          await tx.session.deleteMany({ where: { userId: user.id } });
          
          // Delete accounts
          await tx.account.deleteMany({ where: { userId: user.id } });
          
          // Anonymize user record
          await tx.user.update({
            where: { id: user.id },
            data: {
              email: `deleted_${crypto.randomBytes(8).toString('hex')}@deleted.local`,
              name: 'DELETED USER',
              firstName: 'DELETED',
              lastName: 'USER',
              image: null,
              isActive: false
            }
          });
        }

        // Delete from cache
        await redis.del(`customer:${userId}`);
        await redis.del(`user:${userId}`);
      });

      // Delete exported data files from S3
      await this.deleteUserExportedFiles(userId);

      logger.info(`Data deletion completed for user ${userId}`);
    } catch (error) {
      logger.error(`Error executing data deletion for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Manage audit trail retention policies
   */
  async setRetentionPolicy(policy: AuditRetentionPolicy): Promise<void> {
    try {
      await prisma.setting.upsert({
        where: { key: `retention_policy_${policy.category}` },
        update: { value: JSON.stringify(policy) },
        create: {
          key: `retention_policy_${policy.category}`,
          value: JSON.stringify(policy),
          category: 'retention_policies'
        }
      });

      logger.info(`Retention policy set for ${policy.category}: ${policy.retentionDays} days`);
    } catch (error) {
      logger.error('Error setting retention policy:', error);
      throw error;
    }
  }

  /**
   * Apply retention policies to audit logs
   */
  async applyRetentionPolicies(): Promise<void> {
    try {
      const policies = await prisma.setting.findMany({
        where: { category: 'retention_policies' }
      });

      for (const policyRecord of policies) {
        const policy = JSON.parse(policyRecord.value as string) as AuditRetentionPolicy;
        
        if (policy.autoDelete) {
          const cutoffDate = this.subtractDays(new Date(), policy.retentionDays);
          
          // Archive old logs if configured
          if (policy.compressAfterDays && policy.archiveLocation) {
            const archiveCutoff = this.subtractDays(new Date(), policy.compressAfterDays);
            await this.archiveAuditLogs(policy.category, archiveCutoff, policy.archiveLocation);
          }

          // Delete expired logs
          const deleted = await prisma.auditLog.deleteMany({
            where: {
              action: policy.category,
              createdAt: { lt: cutoffDate }
            }
          });

          logger.info(`Deleted ${deleted.count} expired audit logs for category ${policy.category}`);
        }
      }
    } catch (error) {
      logger.error('Error applying retention policies:', error);
      throw error;
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    type: 'marketing' | 'analytics' | 'cookies' | 'data_processing',
    granted: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<ConsentRecord> {
    try {
      const consent: ConsentRecord = {
        id: crypto.randomUUID(),
        userId,
        type,
        granted,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        version: process.env.PRIVACY_POLICY_VERSION || '1.0'
      };

      // Store consent record
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CONSENT_RECORDED',
          details: consent,
          ipAddress,
          userAgent
        }
      });

      // Update user preferences
      await prisma.setting.upsert({
        where: { key: `consent_${userId}_${type}` },
        update: { value: JSON.stringify(consent) },
        create: {
          key: `consent_${userId}_${type}`,
          value: JSON.stringify(consent),
          category: 'user_consents'
        }
      });

      logger.info(`Consent recorded for user ${userId}: ${type} = ${granted}`);
      return consent;
    } catch (error) {
      logger.error('Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Get all consents for a user
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const consents = await prisma.setting.findMany({
        where: {
          key: { startsWith: `consent_${userId}_` },
          category: 'user_consents'
        }
      });

      return consents.map(c => JSON.parse(c.value as string) as ConsentRecord);
    } catch (error) {
      logger.error('Error getting user consents:', error);
      throw error;
    }
  }

  /**
   * Get data export request status
   */
  async getDataExportRequest(requestId: string): Promise<DataExportRequest | null> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: `data_export_${requestId}` }
      });

      if (!setting) {
        return null;
      }

      return JSON.parse(setting.value as string) as DataExportRequest;
    } catch (error) {
      logger.error('Error getting data export request:', error);
      throw error;
    }
  }

  /**
   * Get data deletion request status
   */
  async getDataDeletionRequest(requestId: string): Promise<DataDeletionRequest | null> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: `data_deletion_${requestId}` }
      });

      if (!setting) {
        return null;
      }

      return JSON.parse(setting.value as string) as DataDeletionRequest;
    } catch (error) {
      logger.error('Error getting data deletion request:', error);
      throw error;
    }
  }

  /**
   * Cancel data deletion request (within 30-day period)
   */
  async cancelDataDeletion(requestId: string, userId: string): Promise<void> {
    try {
      const request = await this.getDataDeletionRequest(requestId);
      
      if (!request) {
        throw new Error('Deletion request not found');
      }

      if (request.userId !== userId) {
        throw new Error('Unauthorized to cancel this request');
      }

      if (request.status === 'completed') {
        throw new Error('Cannot cancel completed deletion request');
      }

      // Update request status to cancelled
      await prisma.setting.update({
        where: { key: `data_deletion_${requestId}` },
        data: {
          value: JSON.stringify({
            ...request,
            status: 'cancelled',
            cancelledAt: new Date()
          })
        }
      });

      logger.info(`Data deletion request ${requestId} cancelled by user ${userId}`);
    } catch (error) {
      logger.error('Error cancelling data deletion request:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encryptData(data: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      iv,
      cipher.update(data),
      cipher.final()
    ]);

    return encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decryptData(encryptedData: Buffer): Buffer {
    const iv = encryptedData.slice(0, 16);
    const data = encryptedData.slice(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final()
    ]);

    return decrypted;
  }

  /**
   * Initialize automated retention jobs
   */
  private initializeRetentionJobs(): void {
    // Run retention policies daily at 2 AM
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        this.applyRetentionPolicies().catch(error => {
          logger.error('Error in retention job:', error);
        });
      }
    }, 60000); // Check every minute
  }

  /**
   * Subtract days from date (custom implementation)
   */
  private subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  /**
   * Format date (custom implementation)
   */
  private formatDate(date: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  // Helper methods
  private async gatherUserData(userId: string): Promise<any> {
    try {
      // Gather all user data from various tables
      const profile = await prisma.customer.findUnique({ where: { id: userId } });
      const sales = await prisma.sale.findMany({ 
        where: { customerId: userId },
        include: {
          saleItems: {
            include: {
              product: true
            }
          }
        }
      });
      
      const consents = await this.getUserConsents(userId);
      const auditLogs = await prisma.auditLog.findMany({ 
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      // Gather interaction data (if you have such tables)
      const interactions: any[] = [];
      
      return {
        profile,
        sales,
        interactions,
        consents,
        auditLogs
      };
    } catch (error) {
      logger.error('Error gathering user data:', error);
      throw error;
    }
  }

  private getDataExportEmailTemplate(downloadUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Data Export is Ready</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Data Export is Ready</h1>
          </div>
          <div class="content">
            <p>Your personal data export has been prepared and is ready for download.</p>
            <p><a href="${downloadUrl}" class="button">Download Your Data</a></p>
            <p><strong>Important Security Information:</strong></p>
            <ul>
              <li>This link will expire in 48 hours for security reasons</li>
              <li>The file is encrypted for your protection</li>
              <li>Only you should access this download link</li>
            </ul>
            <p>Your export includes:</p>
            <ul>
              <li>Profile information</li>
              <li>Purchase history</li>
              <li>Consent records</li>
              <li>Audit logs</li>
            </ul>
            <p>If you need assistance accessing your data or have questions about this export, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This email was sent in response to your data portability request under GDPR Article 20.</p>
            <p>&copy; ${new Date().getFullYear()} Vevurn POS System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDataDeletionEmailTemplate(request: DataDeletionRequest): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Data Deletion Request Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .info-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Data Deletion Request Received</h1>
          </div>
          <div class="content">
            <p>We have received your request to delete your personal data from our system.</p>
            
            <div class="info-box">
              <p><strong>Request Details:</strong></p>
              <ul>
                <li><strong>Request ID:</strong> ${request.id}</li>
                <li><strong>Requested on:</strong> ${this.formatDate(request.requestedAt)}</li>
                <li><strong>Scheduled for:</strong> ${this.formatDate(request.scheduledFor)}</li>
                <li><strong>Status:</strong> ${request.status}</li>
              </ul>
            </div>

            <h3>What happens next?</h3>
            <p>You have <strong>30 days</strong> to cancel this request if you change your mind. After the scheduled date, your data will be:</p>
            <ul>
              <li>Permanently deleted or anonymized</li>
              <li>Removed from our active systems</li>
              <li>Processed according to legal retention requirements</li>
            </ul>

            <h3>Important Notes:</h3>
            <ul>
              <li>Some data may need to be retained for legal or regulatory compliance</li>
              <li>Financial transaction records may be anonymized rather than deleted</li>
              <li>You can cancel this request at any time before the scheduled deletion date</li>
            </ul>

            <p>If you did not request this deletion or wish to cancel it, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>This email was sent in response to your data deletion request under GDPR Article 17 (Right to Erasure).</p>
            <p>&copy; ${new Date().getFullYear()} Vevurn POS System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async updateExportRequestStatus(
    requestId: string,
    status: DataExportRequest['status'],
    additionalData?: Partial<DataExportRequest>
  ): Promise<void> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: `data_export_${requestId}` }
      });

      if (setting) {
        const request = JSON.parse(setting.value as string);
        await prisma.setting.update({
          where: { key: `data_export_${requestId}` },
          data: {
            value: JSON.stringify({
              ...request,
              status,
              ...additionalData
            })
          }
        });
      }
    } catch (error) {
      logger.error('Error updating export request status:', error);
      throw error;
    }
  }

  private async deleteUserExportedFiles(userId: string): Promise<void> {
    try {
      // Note: This is a simplified implementation since S3Service doesn't have listFiles method
      // In a production environment, you would implement a proper file listing and deletion mechanism
      logger.info(`Marked exported files for deletion for user ${userId} (manual cleanup required)`);
    } catch (error) {
      logger.error(`Error deleting exported files for user ${userId}:`, error);
      // Don't throw - this shouldn't prevent the deletion process
    }
  }

  private async archiveAuditLogs(
    category: string,
    cutoffDate: Date,
    archiveLocation: string
  ): Promise<void> {
    try {
      // Get logs to archive
      const logsToArchive = await prisma.auditLog.findMany({
        where: {
          action: category,
          createdAt: { 
            lt: cutoffDate,
            gte: this.subtractDays(cutoffDate, 30) // Archive in 30-day chunks
          }
        }
      });

      if (logsToArchive.length > 0) {
        // Create archive
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks: Buffer[] = [];
        archive.on('data', chunk => chunks.push(chunk));

        // Add logs to archive
        archive.append(JSON.stringify(logsToArchive, null, 2), {
          name: `audit_logs_${category}_${this.formatDate(cutoffDate)}.json`
        });

        await archive.finalize();
        const archiveBuffer = Buffer.concat(chunks);

        // Upload to archive location
        const filename = `archived_audit_logs_${category}_${Date.now()}.zip`;
        await s3Service.uploadFile(archiveBuffer, filename, {
          folder: archiveLocation,
          contentType: 'application/zip'
        });

        // Delete archived logs from database
        await prisma.auditLog.deleteMany({
          where: {
            id: { in: logsToArchive.map(log => log.id) }
          }
        });

        logger.info(`Archived ${logsToArchive.length} audit logs for category ${category} older than ${this.formatDate(cutoffDate)}`);
      }
    } catch (error) {
      logger.error(`Error archiving audit logs for category ${category}:`, error);
      throw error;
    }
  }

  private scheduleDataDeletion(request: DataDeletionRequest): void {
    const delay = request.scheduledFor.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(() => {
        this.executeDataDeletion(request.userId).catch(error => {
          logger.error(`Failed to execute scheduled deletion for user ${request.userId}:`, error);
        });
      }, delay);
      
      logger.info(`Scheduled data deletion for user ${request.userId} in ${Math.round(delay / (24 * 60 * 60 * 1000))} days`);
    } else {
      // Execute immediately if scheduled time has passed
      this.executeDataDeletion(request.userId).catch(error => {
        logger.error(`Failed to execute immediate deletion for user ${request.userId}:`, error);
      });
    }
  }
}

export default GDPRComplianceService;
