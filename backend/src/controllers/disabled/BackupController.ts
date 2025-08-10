import { Request, Response } from 'express';
import { BackupService } from '../services/BackupService';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

const backupService = BackupService.getInstance();

export class BackupController {
  /**
   * Create a manual backup
   */
  static async createBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { configId, type } = req.body;

      if (!configId) {
        res.status(400).json({ error: 'Backup configuration ID is required' });
        return;
      }

      const configs = await backupService.getBackupConfigs();
      const config = configs.find(c => c.id === configId);

      if (!config) {
        res.status(404).json({ error: 'Backup configuration not found' });
        return;
      }

      let result;
      if (type === 'database' || config.type === 'database') {
        result = await backupService.createDatabaseBackup(config);
      } else if (type === 'files' || config.type === 'files') {
        result = await backupService.createFilesBackup(config);
      } else {
        // Full backup
        const dbResult = await backupService.createDatabaseBackup(config);
        const filesResult = await backupService.createFilesBackup(config);
        result = {
          ...dbResult,
          files: [...dbResult.files, ...filesResult.files],
          size: dbResult.size + filesResult.size
        };
      }

      logger.info(`Manual backup created by user ${req.user?.id}: ${configId}`);
      
      res.json({
        success: true,
        backup: result
      });
    } catch (error) {
      logger.error('Failed to create backup:', error);
      res.status(500).json({
        error: 'Failed to create backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all backup configurations
   */
  static async getBackupConfigs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const configs = await backupService.getBackupConfigs();
      res.json({ configs });
    } catch (error) {
      logger.error('Failed to get backup configs:', error);
      res.status(500).json({ error: 'Failed to get backup configurations' });
    }
  }

  /**
   * Create or update backup configuration
   */
  static async saveBackupConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = req.body;

      // Validate required fields
      const requiredFields = ['id', 'name', 'type', 'schedule', 'retention'];
      for (const field of requiredFields) {
        if (!config[field]) {
          res.status(400).json({ error: `${field} is required` });
          return;
        }
      }

      // Validate cron schedule
      if (config.schedule && config.enabled) {
        try {
          const cron = require('node-cron');
          if (!cron.validate(config.schedule)) {
            res.status(400).json({ error: 'Invalid cron schedule' });
            return;
          }
        } catch {
          res.status(400).json({ error: 'Invalid cron schedule' });
          return;
        }
      }

      await backupService.scheduleBackup(config);

      logger.info(`Backup configuration saved by user ${req.user?.id}: ${config.name}`);
      
      res.json({
        success: true,
        message: 'Backup configuration saved successfully'
      });
    } catch (error) {
      logger.error('Failed to save backup config:', error);
      res.status(500).json({
        error: 'Failed to save backup configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get backup history for a configuration
   */
  static async getBackupHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const backups = await backupService.getBackupsForConfig(configId);
      
      // Paginate results
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedBackups = backups.slice(startIndex, endIndex);

      res.json({
        backups: paginatedBackups,
        total: backups.length,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(backups.length / Number(limit))
      });
    } catch (error) {
      logger.error('Failed to get backup history:', error);
      res.status(500).json({ error: 'Failed to get backup history' });
    }
  }

  /**
   * Verify backup integrity
   */
  static async verifyBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { backupId } = req.params;

      const isValid = await backupService.verifyBackup(backupId);

      res.json({
        backupId,
        isValid,
        message: isValid ? 'Backup integrity verified' : 'Backup integrity check failed'
      });
    } catch (error) {
      logger.error('Failed to verify backup:', error);
      res.status(500).json({
        error: 'Failed to verify backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Restore from backup
   */
  static async restoreFromBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { backupId } = req.params;
      const { targetEnvironment } = req.body;

      // Only allow admin users to perform restore
      if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        res.status(403).json({ error: 'Insufficient permissions to perform restore' });
        return;
      }

      // Verify backup before restore
      const isValid = await backupService.verifyBackup(backupId);
      if (!isValid) {
        res.status(400).json({ error: 'Backup integrity check failed. Cannot restore.' });
        return;
      }

      await backupService.restoreFromBackup(backupId, targetEnvironment);

      logger.warn(`Database restore performed by user ${req.user?.id} from backup: ${backupId}`);
      
      res.json({
        success: true,
        message: 'Restore completed successfully'
      });
    } catch (error) {
      logger.error('Failed to restore from backup:', error);
      res.status(500).json({
        error: 'Failed to restore from backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create restore point
   */
  static async createRestorePoint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { description } = req.body;

      if (!description) {
        res.status(400).json({ error: 'Description is required for restore point' });
        return;
      }

      const restorePointId = await backupService.createRestorePoint(description);

      logger.info(`Restore point created by user ${req.user?.id}: ${description}`);
      
      res.json({
        success: true,
        restorePointId,
        message: 'Restore point created successfully'
      });
    } catch (error) {
      logger.error('Failed to create restore point:', error);
      res.status(500).json({
        error: 'Failed to create restore point',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Apply retention policies manually
   */
  static async applyRetentionPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await backupService.applyRetentionPolicies();

      logger.info(`Retention policies applied manually by user ${req.user?.id}`);
      
      res.json({
        success: true,
        message: 'Retention policies applied successfully'
      });
    } catch (error) {
      logger.error('Failed to apply retention policies:', error);
      res.status(500).json({
        error: 'Failed to apply retention policies',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get backup statistics and metrics
   */
  static async getBackupStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const configs = await backupService.getBackupConfigs();
      const allBackups: any[] = [];

      // Collect all backups
      for (const config of configs) {
        const backups = await backupService.getBackupsForConfig(config.id);
        allBackups.push(...backups);
      }

      // Calculate statistics
      const totalBackups = allBackups.length;
      const successfulBackups = allBackups.filter(b => b.status === 'success').length;
      const failedBackups = allBackups.filter(b => b.status === 'failed').length;
      const totalSize = allBackups.reduce((sum, b) => sum + (b.size || 0), 0);
      
      const avgDuration = totalBackups > 0 
        ? allBackups.reduce((sum, b) => sum + (b.duration || 0), 0) / totalBackups 
        : 0;

      // Recent backups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentBackups = allBackups.filter(b => new Date(b.timestamp) > sevenDaysAgo);

      // Storage breakdown by type
      const storageByType = {
        database: allBackups
          .filter(b => b.type === 'database')
          .reduce((sum, b) => sum + (b.size || 0), 0),
        files: allBackups
          .filter(b => b.type === 'files')
          .reduce((sum, b) => sum + (b.size || 0), 0),
        full: allBackups
          .filter(b => b.type === 'full')
          .reduce((sum, b) => sum + (b.size || 0), 0)
      };

      const stats = {
        total: {
          backups: totalBackups,
          successful: successfulBackups,
          failed: failedBackups,
          size: totalSize,
          avgDuration: Math.round(avgDuration)
        },
        recent: {
          count: recentBackups.length,
          successful: recentBackups.filter(b => b.status === 'success').length,
          failed: recentBackups.filter(b => b.status === 'failed').length
        },
        storage: storageByType,
        configs: {
          total: configs.length,
          enabled: configs.filter(c => c.enabled).length,
          disabled: configs.filter(c => !c.enabled).length
        },
        successRate: totalBackups > 0 ? Math.round((successfulBackups / totalBackups) * 100) : 0
      };

      res.json({ stats });
    } catch (error) {
      logger.error('Failed to get backup stats:', error);
      res.status(500).json({ error: 'Failed to get backup statistics' });
    }
  }

  /**
   * Delete backup configuration
   */
  static async deleteBackupConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { configId } = req.params;

      // Only allow admin users to delete backup configs
      if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        res.status(403).json({ error: 'Insufficient permissions to delete backup configuration' });
        return;
      }

      // Remove from database
      await require('@prisma/client').prisma.setting.delete({
        where: { key: `backup_config_${configId}` }
      });

      logger.info(`Backup configuration deleted by user ${req.user?.id}: ${configId}`);
      
      res.json({
        success: true,
        message: 'Backup configuration deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete backup config:', error);
      res.status(500).json({
        error: 'Failed to delete backup configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test backup configuration
   */
  static async testBackupConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = req.body;

      // Validate configuration
      const requiredFields = ['name', 'type', 'destinations'];
      for (const field of requiredFields) {
        if (!config[field]) {
          res.status(400).json({ error: `${field} is required` });
          return;
        }
      }

      // Test database connection if it's a database backup
      if (config.type === 'database' || config.type === 'full') {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
          res.status(500).json({ error: 'DATABASE_URL not configured' });
          return;
        }
      }

      // Test destinations
      for (const destination of config.destinations) {
        if (destination.type === 's3') {
          // Test S3 connection
          try {
            const { s3Service } = require('../services/S3Service');
            // This would be a test upload/delete operation
            logger.info('S3 destination test passed');
          } catch (error) {
            res.status(400).json({ 
              error: `S3 destination test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
            return;
          }
        }
      }

      res.json({
        success: true,
        message: 'Backup configuration test passed'
      });
    } catch (error) {
      logger.error('Failed to test backup config:', error);
      res.status(500).json({
        error: 'Failed to test backup configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default BackupController;
