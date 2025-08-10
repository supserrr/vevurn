import { PrismaClient } from '@prisma/client';
import { s3Service } from './S3Service';
import { EmailService } from './EmailService';
import { logger } from '../utils/logger';
import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as archiver from 'archiver';

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const emailService = EmailService.getInstance();

interface BackupConfig {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential' | 'database' | 'files';
  schedule: string; // Cron expression
  retention: {
    daily: number;    // Keep daily backups for X days
    weekly: number;   // Keep weekly backups for X weeks
    monthly: number;  // Keep monthly backups for X months
  };
  compression: 'gzip' | 'bzip2' | 'none';
  encryption: boolean;
  destinations: Array<{
    type: 's3' | 'local';
    config: any;
  }>;
  notifications: {
    onSuccess: string[];
    onFailure: string[];
  };
  enabled: boolean;
}

interface BackupResult {
  id: string;
  configId: string;
  timestamp: Date;
  type: string;
  size: number;
  duration: number; // in seconds
  status: 'success' | 'failed' | 'partial';
  files: string[];
  error?: string;
  checksum?: string;
}

interface RestorePoint {
  id: string;
  backupId: string;
  timestamp: Date;
  description: string;
  verified: boolean;
  lastVerified?: Date;
}

export class BackupService {
  private static instance: BackupService;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private encryptionKey: Buffer;

  static getInstance(): BackupService {
    if (!this.instance) {
      this.instance = new BackupService();
    }
    return this.instance;
  }

  constructor() {
    const key = process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(key, 'hex');
    
    // Load and initialize backup schedules
    this.initializeBackupSchedules();
  }

  /**
   * Create a full database backup
   */
  async createDatabaseBackup(config: BackupConfig): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = crypto.randomUUID();
    const timestamp = new Date();
    const backupDir = path.join('/tmp', 'backups', backupId);

    try {
      // Create backup directory
      await fs.promises.mkdir(backupDir, { recursive: true });

      // Database connection details
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) throw new Error('DATABASE_URL not configured');

      // Parse database URL
      const dbConfig = this.parseDatabaseUrl(dbUrl);
      
      // Create database dump
      const dumpFile = path.join(backupDir, 'database.sql');
      const dumpCommand = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${dumpFile} --verbose --no-owner --no-acl`;
      
      logger.info(`Starting database backup: ${config.name}`);
      await execAsync(dumpCommand);

      // Get file stats
      const stats = await fs.promises.stat(dumpFile);
      let finalFile = dumpFile;
      let finalSize = stats.size;

      // Compress if configured
      if (config.compression !== 'none') {
        finalFile = await this.compressFile(dumpFile, config.compression);
        const compressedStats = await fs.promises.stat(finalFile);
        finalSize = compressedStats.size;
        
        // Remove uncompressed file
        await fs.promises.unlink(dumpFile);
      }

      // Encrypt if configured
      if (config.encryption) {
        const encryptedFile = await this.encryptFile(finalFile);
        await fs.promises.unlink(finalFile);
        finalFile = encryptedFile;
        const encryptedStats = await fs.promises.stat(finalFile);
        finalSize = encryptedStats.size;
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(finalFile);

      // Upload to destinations
      const uploadedFiles: string[] = [];
      for (const destination of config.destinations) {
        const uploadedFile = await this.uploadToDestination(finalFile, destination, config, timestamp);
        uploadedFiles.push(uploadedFile);
      }

      // Clean up local files
      await fs.promises.rm(backupDir, { recursive: true, force: true });

      const duration = (Date.now() - startTime) / 1000;

      // Record backup result
      const result: BackupResult = {
        id: backupId,
        configId: config.id,
        timestamp,
        type: config.type,
        size: finalSize,
        duration,
        status: 'success',
        files: uploadedFiles,
        checksum
      };

      await this.saveBackupResult(result);

      // Send success notification
      await this.sendBackupNotification(config, result, 'success');

      logger.info(`Database backup completed: ${config.name} (${duration}s, ${this.formatBytes(finalSize)})`);

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      const result: BackupResult = {
        id: backupId,
        configId: config.id,
        timestamp,
        type: config.type,
        size: 0,
        duration,
        status: 'failed',
        files: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      await this.saveBackupResult(result);
      await this.sendBackupNotification(config, result, 'failure');

      logger.error(`Database backup failed: ${config.name}`, error);
      throw error;
    }
  }

  /**
   * Create application files backup
   */
  async createFilesBackup(config: BackupConfig): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = crypto.randomUUID();
    const timestamp = new Date();
    const backupFile = path.join('/tmp', `files_backup_${backupId}.zip`);

    try {
      logger.info(`Starting files backup: ${config.name}`);

      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      const output = fs.createWriteStream(backupFile);
      archive.pipe(output);

      // Add upload directories
      const uploadDirs = [
        process.env.UPLOAD_DIR || './uploads',
        process.env.REPORTS_DIR || './reports',
        process.env.EXPORTS_DIR || './exports'
      ];

      for (const dir of uploadDirs) {
        if (fs.existsSync(dir)) {
          archive.directory(dir, path.basename(dir));
        }
      }

      // Add configuration files (excluding sensitive data)
      const configFiles = [
        '.env.example',
        'package.json',
        'prisma/schema.prisma'
      ];

      for (const file of configFiles) {
        if (fs.existsSync(file)) {
          archive.file(file, { name: `config/${path.basename(file)}` });
        }
      }

      await archive.finalize();

      // Wait for archive to complete
      await new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        output.on('error', reject);
      });

      // Get file stats
      const stats = await fs.promises.stat(backupFile);
      let finalFile = backupFile;
      let finalSize = stats.size;

      // Encrypt if configured
      if (config.encryption) {
        const encryptedFile = await this.encryptFile(finalFile);
        await fs.promises.unlink(finalFile);
        finalFile = encryptedFile;
        const encryptedStats = await fs.promises.stat(finalFile);
        finalSize = encryptedStats.size;
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(finalFile);

      // Upload to destinations
      const uploadedFiles: string[] = [];
      for (const destination of config.destinations) {
        const uploadedFile = await this.uploadToDestination(finalFile, destination, config, timestamp);
        uploadedFiles.push(uploadedFile);
      }

      // Clean up local file
      await fs.promises.unlink(finalFile);

      const duration = (Date.now() - startTime) / 1000;

      const result: BackupResult = {
        id: backupId,
        configId: config.id,
        timestamp,
        type: 'files',
        size: finalSize,
        duration,
        status: 'success',
        files: uploadedFiles,
        checksum
      };

      await this.saveBackupResult(result);
      await this.sendBackupNotification(config, result, 'success');

      logger.info(`Files backup completed: ${config.name} (${duration}s, ${this.formatBytes(finalSize)})`);

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      const result: BackupResult = {
        id: backupId,
        configId: config.id,
        timestamp,
        type: 'files',
        size: 0,
        duration,
        status: 'failed',
        files: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      await this.saveBackupResult(result);
      await this.sendBackupNotification(config, result, 'failure');

      logger.error(`Files backup failed: ${config.name}`, error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string, targetEnvironment?: string): Promise<void> {
    try {
      logger.info(`Starting restore from backup: ${backupId}`);

      // Get backup details
      const backup = await this.getBackupResult(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Verify backup integrity
      const isValid = await this.verifyBackup(backupId);
      if (!isValid) {
        throw new Error(`Backup ${backupId} failed integrity check`);
      }

      // Create restore point before restoration
      const restorePointId = await this.createRestorePoint('Pre-restore checkpoint');

      try {
        // Download backup file
        const localFile = await this.downloadBackup(backup);

        // Decrypt if necessary
        let processedFile = localFile;
        if (localFile.endsWith('.enc')) {
          processedFile = await this.decryptFile(localFile);
          await fs.promises.unlink(localFile);
        }

        // Decompress if necessary
        if (processedFile.endsWith('.gz') || processedFile.endsWith('.bz2')) {
          const decompressed = await this.decompressFile(processedFile);
          await fs.promises.unlink(processedFile);
          processedFile = decompressed;
        }

        // Restore based on backup type
        if (backup.type === 'database' || backup.type === 'full') {
          await this.restoreDatabase(processedFile, targetEnvironment);
        }
        
        if (backup.type === 'files' || backup.type === 'full') {
          await this.restoreFiles(processedFile);
        }

        // Clean up
        await fs.promises.unlink(processedFile);

        logger.info(`Restore completed successfully from backup: ${backupId}`);
      } catch (error) {
        // Note: Restore point rollback would need additional implementation
        logger.error('Restore failed:', error);
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to restore from backup ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      const backup = await this.getBackupResult(backupId);
      if (!backup || !backup.checksum) {
        return false;
      }

      // Download and verify checksum
      const localFile = await this.downloadBackup(backup);
      const calculatedChecksum = await this.calculateChecksum(localFile);
      
      // Clean up
      await fs.promises.unlink(localFile);

      return calculatedChecksum === backup.checksum;
    } catch (error) {
      logger.error(`Failed to verify backup ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Apply retention policies
   */
  async applyRetentionPolicies(): Promise<void> {
    try {
      const configs = await this.getBackupConfigs();

      for (const config of configs) {
        const backups = await this.getBackupsForConfig(config.id);
        
        // Group backups by age
        const now = new Date();
        const dailyCutoff = this.subtractDays(now, config.retention.daily);
        const weeklyCutoff = this.subtractDays(now, config.retention.weekly * 7);
        const monthlyCutoff = this.subtractMonths(now, config.retention.monthly);

        for (const backup of backups) {
          let shouldDelete = false;

          if (backup.timestamp < monthlyCutoff) {
            // Keep only one backup per month for old backups
            shouldDelete = !this.isFirstOfMonth(backup.timestamp, backups);
          } else if (backup.timestamp < weeklyCutoff) {
            // Keep only one backup per week for medium-age backups
            shouldDelete = !this.isFirstOfWeek(backup.timestamp, backups);
          } else if (backup.timestamp < dailyCutoff) {
            // Delete daily backups older than retention period
            shouldDelete = true;
          }

          if (shouldDelete) {
            await this.deleteBackup(backup.id);
            logger.info(`Deleted backup ${backup.id} according to retention policy`);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to apply retention policies:', error);
    }
  }

  /**
   * Schedule automated backups
   */
  async scheduleBackup(config: BackupConfig): Promise<void> {
    try {
      // Save config
      await prisma.setting.upsert({
        where: { key: `backup_config_${config.id}` },
        update: { value: JSON.stringify(config) },
        create: {
          key: `backup_config_${config.id}`,
          value: JSON.stringify(config),
          category: 'backup_configs'
        }
      });

      // Cancel existing job if exists
      if (this.scheduledJobs.has(config.id)) {
        this.scheduledJobs.get(config.id)?.stop();
      }

      if (config.enabled) {
        // Schedule new job
        const job = cron.schedule(config.schedule, async () => {
          try {
            if (config.type === 'full') {
              await this.createDatabaseBackup(config);
              await this.createFilesBackup(config);
            } else if (config.type === 'database') {
              await this.createDatabaseBackup(config);
            } else if (config.type === 'files') {
              await this.createFilesBackup(config);
            }
          } catch (error) {
            logger.error(`Scheduled backup failed: ${config.name}`, error);
          }
        });

        this.scheduledJobs.set(config.id, job);
        job.start();

        logger.info(`Scheduled backup ${config.name} with schedule: ${config.schedule}`);
      }
    } catch (error) {
      logger.error('Failed to schedule backup:', error);
      throw error;
    }
  }

  /**
   * Get all backup configurations
   */
  async getBackupConfigs(): Promise<BackupConfig[]> {
    try {
      const settings = await prisma.setting.findMany({
        where: { 
          key: { startsWith: 'backup_config_' },
          category: 'backup_configs'
        }
      });

      return settings.map(setting => JSON.parse(setting.value as string) as BackupConfig);
    } catch (error) {
      logger.error('Failed to get backup configs:', error);
      return [];
    }
  }

  /**
   * Get backup results for a configuration
   */
  async getBackupsForConfig(configId: string): Promise<BackupResult[]> {
    try {
      const settings = await prisma.setting.findMany({
        where: { 
          key: { startsWith: 'backup_result_' },
          category: 'backup_results'
        }
      });

      const results = settings
        .map(setting => JSON.parse(setting.value as string) as BackupResult)
        .filter(result => result.configId === configId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return results;
    } catch (error) {
      logger.error('Failed to get backups for config:', error);
      return [];
    }
  }

  /**
   * Create a restore point
   */
  async createRestorePoint(description: string): Promise<string> {
    try {
      const restorePointId = crypto.randomUUID();
      const config: BackupConfig = {
        id: restorePointId,
        name: `Restore Point: ${description}`,
        type: 'full',
        schedule: '', // Not scheduled
        retention: { daily: 7, weekly: 4, monthly: 6 },
        compression: 'gzip',
        encryption: true,
        destinations: [{ type: 's3', config: {} }],
        notifications: { onSuccess: [], onFailure: [] },
        enabled: false
      };

      // Create immediate backup
      await this.createDatabaseBackup(config);
      
      const restorePoint: RestorePoint = {
        id: restorePointId,
        backupId: restorePointId,
        timestamp: new Date(),
        description,
        verified: false
      };

      await prisma.setting.create({
        data: {
          key: `restore_point_${restorePointId}`,
          value: JSON.stringify(restorePoint),
          category: 'restore_points'
        }
      });

      logger.info(`Created restore point: ${description}`);
      return restorePointId;
    } catch (error) {
      logger.error('Failed to create restore point:', error);
      throw error;
    }
  }

  // Helper methods
  private parseDatabaseUrl(url: string): any {
    const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);
    
    if (!match) {
      throw new Error('Invalid database URL');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5]
    };
  }

  private async compressFile(file: string, type: 'gzip' | 'bzip2'): Promise<string> {
    const ext = type === 'gzip' ? '.gz' : '.bz2';
    const compressedFile = `${file}${ext}`;
    const command = type === 'gzip' ? 
      `gzip -9 -c ${file} > ${compressedFile}` :
      `bzip2 -9 -c ${file} > ${compressedFile}`;
    
    await execAsync(command);
    return compressedFile;
  }

  private async decompressFile(file: string): Promise<string> {
    const baseName = file.replace(/\.(gz|bz2)$/, '');
    const command = file.endsWith('.gz') ? 
      `gunzip -c ${file} > ${baseName}` :
      `bunzip2 -c ${file} > ${baseName}`;
    
    await execAsync(command);
    return baseName;
  }

  private async encryptFile(file: string): Promise<string> {
    const encryptedFile = `${file}.enc`;
    const input = fs.createReadStream(file);
    const output = fs.createWriteStream(encryptedFile);
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    // Write IV at the beginning of the file
    output.write(iv);
    
    input.pipe(cipher).pipe(output);
    
    await new Promise<void>((resolve, reject) => {
      output.on('finish', () => resolve());
      output.on('error', reject);
    });

    return encryptedFile;
  }

  private async decryptFile(encryptedFile: string): Promise<string> {
    const decryptedFile = encryptedFile.replace('.enc', '');
    const input = fs.createReadStream(encryptedFile);
    const output = fs.createWriteStream(decryptedFile);
    
    // Read IV from the beginning of the file
    const ivBuffer = Buffer.alloc(16);
    await new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(encryptedFile, { start: 0, end: 15 });
      stream.on('data', (chunk: string | Buffer) => {
        if (Buffer.isBuffer(chunk)) {
          chunk.copy(ivBuffer);
        } else {
          Buffer.from(chunk).copy(ivBuffer);
        }
        resolve();
      });
      stream.on('error', reject);
    });
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, ivBuffer);
    
    // Create stream starting after IV
    const dataStream = fs.createReadStream(encryptedFile, { start: 16 });
    dataStream.pipe(decipher).pipe(output);
    
    await new Promise<void>((resolve, reject) => {
      output.on('finish', () => resolve());
      output.on('error', reject);
    });

    return decryptedFile;
  }

  private async calculateChecksum(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(file);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async uploadToDestination(
    file: string, 
    destination: any, 
    config: BackupConfig, 
    timestamp: Date
  ): Promise<string> {
    const fileName = `${config.name}_${timestamp.toISOString().replace(/[:.]/g, '-')}_${path.basename(file)}`;
    
    if (destination.type === 's3') {
      const fileBuffer = await fs.promises.readFile(file);
      const result = await s3Service.uploadFile(fileBuffer, fileName, {
        folder: 'backups',
        contentType: 'application/octet-stream'
      });
      return result.url;
    } else if (destination.type === 'local') {
      const destPath = path.join(destination.config.path || './backups', fileName);
      await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
      await fs.promises.copyFile(file, destPath);
      return destPath;
    }
    
    throw new Error(`Unsupported destination type: ${destination.type}`);
  }

  private async saveBackupResult(result: BackupResult): Promise<void> {
    await prisma.setting.create({
      data: {
        key: `backup_result_${result.id}`,
        value: JSON.stringify(result),
        category: 'backup_results'
      }
    });
  }

  private async getBackupResult(backupId: string): Promise<BackupResult | null> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: `backup_result_${backupId}` }
      });
      
      return setting ? JSON.parse(setting.value as string) as BackupResult : null;
    } catch (error) {
      logger.error('Failed to get backup result:', error);
      return null;
    }
  }

  private async downloadBackup(backup: BackupResult): Promise<string> {
    // This is a simplified implementation - would need to handle different storage types
    const tempFile = path.join('/tmp', `restore_${backup.id}_${Date.now()}`);
    
    if (backup.files.length > 0) {
      const backupUrl = backup.files[0]; // Use first file
      
      if (backupUrl.startsWith('http')) {
        // Download from URL (S3 signed URL)
        const response = await fetch(backupUrl);
        const arrayBuffer = await response.arrayBuffer();
        await fs.promises.writeFile(tempFile, Buffer.from(arrayBuffer));
      } else {
        // Local file
        await fs.promises.copyFile(backupUrl, tempFile);
      }
    }
    
    return tempFile;
  }

  private async restoreDatabase(sqlFile: string, targetEnvironment?: string): Promise<void> {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) throw new Error('DATABASE_URL not configured');

      const dbConfig = this.parseDatabaseUrl(dbUrl);
      const restoreCommand = `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${sqlFile}`;
      
      await execAsync(restoreCommand);
      logger.info('Database restore completed');
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw error;
    }
  }

  private async restoreFiles(zipFile: string): Promise<void> {
    try {
      const extractDir = '/tmp/restore_files';
      await fs.promises.mkdir(extractDir, { recursive: true });
      
      // Extract files (simplified - would use proper zip extraction)
      const extractCommand = `unzip -o ${zipFile} -d ${extractDir}`;
      await execAsync(extractCommand);
      
      // Copy files to their destinations
      // This would need more sophisticated file restoration logic
      
      logger.info('Files restore completed');
    } catch (error) {
      logger.error('Files restore failed:', error);
      throw error;
    }
  }

  private async deleteBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.getBackupResult(backupId);
      if (!backup) return;

      // Delete files from storage
      for (const file of backup.files) {
        // Handle different storage types
        if (file.startsWith('http')) {
          // S3 file - would need to extract key and delete
          logger.info(`Would delete S3 file: ${file}`);
        } else {
          // Local file
          if (fs.existsSync(file)) {
            await fs.promises.unlink(file);
          }
        }
      }

      // Delete backup record
      await prisma.setting.delete({
        where: { key: `backup_result_${backupId}` }
      });

      logger.info(`Backup ${backupId} deleted successfully`);
    } catch (error) {
      logger.error(`Failed to delete backup ${backupId}:`, error);
    }
  }

  private async sendBackupNotification(config: BackupConfig, result: BackupResult, type: 'success' | 'failure'): Promise<void> {
    try {
      const recipients = type === 'success' ? config.notifications.onSuccess : config.notifications.onFailure;
      
      if (recipients.length === 0) return;

      const subject = `Backup ${type === 'success' ? 'Completed' : 'Failed'}: ${config.name}`;
      const message = this.getBackupNotificationMessage(config, result, type);

      for (const email of recipients) {
        await emailService.sendEmail({
          to: email,
          subject,
          html: message
        });
      }
    } catch (error) {
      logger.error('Failed to send backup notification:', error);
    }
  }

  private getBackupNotificationMessage(config: BackupConfig, result: BackupResult, type: 'success' | 'failure'): string {
    if (type === 'success') {
      return `
        <h2>Backup Completed Successfully</h2>
        <p><strong>Backup:</strong> ${config.name}</p>
        <p><strong>Type:</strong> ${result.type}</p>
        <p><strong>Size:</strong> ${this.formatBytes(result.size)}</p>
        <p><strong>Duration:</strong> ${result.duration}s</p>
        <p><strong>Timestamp:</strong> ${result.timestamp.toISOString()}</p>
      `;
    } else {
      return `
        <h2>Backup Failed</h2>
        <p><strong>Backup:</strong> ${config.name}</p>
        <p><strong>Error:</strong> ${result.error}</p>
        <p><strong>Duration:</strong> ${result.duration}s</p>
        <p><strong>Timestamp:</strong> ${result.timestamp.toISOString()}</p>
      `;
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  private subtractMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() - months);
    return result;
  }

  private isFirstOfMonth(date: Date, backups: BackupResult[]): boolean {
    const monthBackups = backups.filter(backup => 
      backup.timestamp.getFullYear() === date.getFullYear() &&
      backup.timestamp.getMonth() === date.getMonth()
    );
    return monthBackups.length > 0 && monthBackups[0].timestamp === date;
  }

  private isFirstOfWeek(date: Date, backups: BackupResult[]): boolean {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekBackups = backups.filter(backup => 
      backup.timestamp >= weekStart && backup.timestamp <= weekEnd
    );
    return weekBackups.length > 0 && weekBackups[0].timestamp === date;
  }

  private async initializeBackupSchedules(): Promise<void> {
    try {
      const configs = await this.getBackupConfigs();
      
      for (const config of configs) {
        if (config.enabled) {
          await this.scheduleBackup(config);
        }
      }
      
      logger.info(`Initialized ${configs.length} backup schedules`);
    } catch (error) {
      logger.error('Failed to initialize backup schedules:', error);
    }
  }
}

export default BackupService;
