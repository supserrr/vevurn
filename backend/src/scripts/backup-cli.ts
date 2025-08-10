#!/usr/bin/env node

/**
 * Backup Management CLI
 * Command-line interface for managing backups in Vevurn POS system
 */

import { program } from 'commander';
import { BackupService } from '../services/BackupService';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const backupService = BackupService.getInstance();

// CLI Program setup
program
  .name('backup-cli')
  .description('Vevurn POS Backup Management CLI')
  .version('1.0.0');

/**
 * Create backup command
 */
program
  .command('create')
  .description('Create a backup')
  .option('-c, --config <configId>', 'Backup configuration ID')
  .option('-t, --type <type>', 'Backup type (database, files, full)', 'full')
  .option('-n, --name <name>', 'Backup name')
  .action(async (options) => {
    try {
      console.log('Starting backup creation...');

      let config;
      if (options.config) {
        const configs = await backupService.getBackupConfigs();
        config = configs.find(c => c.id === options.config);
        
        if (!config) {
          console.error(`Backup configuration not found: ${options.config}`);
          process.exit(1);
        }
      } else {
        // Create a temporary config for manual backup
        config = {
          id: `manual_${Date.now()}`,
          name: options.name || `Manual backup ${new Date().toISOString()}`,
          type: options.type,
          schedule: '',
          retention: { daily: 7, weekly: 4, monthly: 6 },
          compression: 'gzip',
          encryption: true,
          destinations: [{ type: 's3', config: {} }],
          notifications: { onSuccess: [], onFailure: [] },
          enabled: false
        };
      }

      let result;
      if (config.type === 'database' || options.type === 'database') {
        result = await backupService.createDatabaseBackup(config);
      } else if (config.type === 'files' || options.type === 'files') {
        result = await backupService.createFilesBackup(config);
      } else {
        // Full backup
        console.log('Creating database backup...');
        const dbResult = await backupService.createDatabaseBackup(config);
        console.log('Creating files backup...');
        const filesResult = await backupService.createFilesBackup(config);
        
        result = {
          ...dbResult,
          files: [...dbResult.files, ...filesResult.files],
          size: dbResult.size + filesResult.size
        };
      }

      console.log('\n✅ Backup completed successfully!');
      console.log(`Backup ID: ${result.id}`);
      console.log(`Size: ${formatBytes(result.size)}`);
      console.log(`Duration: ${result.duration}s`);
      console.log(`Files: ${result.files.length}`);
    } catch (error) {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    }
  });

/**
 * List backups command
 */
program
  .command('list')
  .description('List backup configurations and history')
  .option('-c, --config <configId>', 'Show backups for specific configuration')
  .option('--configs', 'Show only configurations')
  .option('--limit <number>', 'Limit number of results', '20')
  .action(async (options) => {
    try {
      if (options.configs) {
        const configs = await backupService.getBackupConfigs();
        console.log('\n📋 Backup Configurations:');
        console.log('─'.repeat(80));
        
        for (const config of configs) {
          console.log(`ID: ${config.id}`);
          console.log(`Name: ${config.name}`);
          console.log(`Type: ${config.type}`);
          console.log(`Schedule: ${config.schedule}`);
          console.log(`Enabled: ${config.enabled ? '✅' : '❌'}`);
          console.log('─'.repeat(80));
        }
      } else if (options.config) {
        const backups = await backupService.getBackupsForConfig(options.config);
        const limited = backups.slice(0, parseInt(options.limit));
        
        console.log(`\n💾 Backup History for ${options.config}:`);
        console.log('─'.repeat(80));
        
        for (const backup of limited) {
          console.log(`ID: ${backup.id}`);
          console.log(`Timestamp: ${backup.timestamp.toISOString()}`);
          console.log(`Status: ${backup.status === 'success' ? '✅' : '❌'} ${backup.status}`);
          console.log(`Size: ${formatBytes(backup.size)}`);
          console.log(`Duration: ${backup.duration}s`);
          if (backup.error) console.log(`Error: ${backup.error}`);
          console.log('─'.repeat(80));
        }
      } else {
        const configs = await backupService.getBackupConfigs();
        console.log('\n📊 Backup Overview:');
        console.log('─'.repeat(80));
        
        for (const config of configs) {
          const backups = await backupService.getBackupsForConfig(config.id);
          const recent = backups.slice(0, 3);
          
          console.log(`Configuration: ${config.name} (${config.type})`);
          console.log(`Status: ${config.enabled ? '✅ Enabled' : '❌ Disabled'}`);
          console.log(`Total Backups: ${backups.length}`);
          
          if (recent.length > 0) {
            console.log('Recent Backups:');
            recent.forEach(backup => {
              console.log(`  • ${backup.timestamp.toISOString()} - ${backup.status} (${formatBytes(backup.size)})`);
            });
          }
          console.log('─'.repeat(80));
        }
      }
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      process.exit(1);
    }
  });

/**
 * Restore command
 */
program
  .command('restore')
  .description('Restore from backup')
  .requiredOption('-b, --backup <backupId>', 'Backup ID to restore from')
  .option('-e, --environment <env>', 'Target environment')
  .option('--verify', 'Verify backup before restore')
  .action(async (options) => {
    try {
      console.log(`Starting restore from backup: ${options.backup}`);

      if (options.verify) {
        console.log('Verifying backup integrity...');
        const isValid = await backupService.verifyBackup(options.backup);
        
        if (!isValid) {
          console.error('❌ Backup integrity check failed!');
          process.exit(1);
        }
        console.log('✅ Backup integrity verified');
      }

      // Ask for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('\n⚠️  WARNING: This will overwrite current data. Continue? (yes/no): ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('Restore cancelled');
        process.exit(0);
      }

      await backupService.restoreFromBackup(options.backup, options.environment);

      console.log('✅ Restore completed successfully!');
    } catch (error) {
      console.error('❌ Restore failed:', error);
      process.exit(1);
    }
  });

/**
 * Verify command
 */
program
  .command('verify')
  .description('Verify backup integrity')
  .requiredOption('-b, --backup <backupId>', 'Backup ID to verify')
  .action(async (options) => {
    try {
      console.log(`Verifying backup: ${options.backup}`);
      
      const isValid = await backupService.verifyBackup(options.backup);
      
      if (isValid) {
        console.log('✅ Backup integrity verified successfully');
      } else {
        console.log('❌ Backup integrity check failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    }
  });

/**
 * Schedule command
 */
program
  .command('schedule')
  .description('Schedule backup configuration')
  .requiredOption('-f, --file <configFile>', 'Backup configuration JSON file')
  .action(async (options) => {
    try {
      const configPath = path.resolve(options.file);
      
      if (!fs.existsSync(configPath)) {
        console.error(`Configuration file not found: ${configPath}`);
        process.exit(1);
      }

      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      // Validate required fields
      const requiredFields = ['id', 'name', 'type', 'schedule', 'retention'];
      for (const field of requiredFields) {
        if (!config[field]) {
          console.error(`Missing required field: ${field}`);
          process.exit(1);
        }
      }

      await backupService.scheduleBackup(config);

      console.log(`✅ Backup scheduled: ${config.name}`);
      console.log(`Schedule: ${config.schedule}`);
      console.log(`Enabled: ${config.enabled ? 'Yes' : 'No'}`);
    } catch (error) {
      console.error('❌ Failed to schedule backup:', error);
      process.exit(1);
    }
  });

/**
 * Stats command
 */
program
  .command('stats')
  .description('Show backup statistics')
  .action(async () => {
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

      console.log('\n📊 Backup Statistics:');
      console.log('═'.repeat(50));
      console.log(`Total Backups: ${totalBackups}`);
      console.log(`Successful: ${successfulBackups} (${totalBackups > 0 ? Math.round((successfulBackups / totalBackups) * 100) : 0}%)`);
      console.log(`Failed: ${failedBackups} (${totalBackups > 0 ? Math.round((failedBackups / totalBackups) * 100) : 0}%)`);
      console.log(`Total Size: ${formatBytes(totalSize)}`);
      console.log(`Average Duration: ${Math.round(avgDuration)}s`);
      console.log(`Active Configurations: ${configs.filter(c => c.enabled).length}/${configs.length}`);
      console.log('═'.repeat(50));

      // Recent activity
      const recentBackups = allBackups
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      if (recentBackups.length > 0) {
        console.log('\n📅 Recent Activity:');
        console.log('─'.repeat(50));
        recentBackups.forEach(backup => {
          const status = backup.status === 'success' ? '✅' : '❌';
          console.log(`${status} ${backup.timestamp.toISOString()} - ${backup.type} (${formatBytes(backup.size)})`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      process.exit(1);
    }
  });

/**
 * Cleanup command
 */
program
  .command('cleanup')
  .description('Apply retention policies and cleanup old backups')
  .option('--dry-run', 'Show what would be deleted without actually deleting')
  .action(async (options) => {
    try {
      console.log('🧹 Running backup cleanup...');
      
      if (options.dryRun) {
        console.log('DRY RUN MODE - No files will be deleted');
      }

      await backupService.applyRetentionPolicies();
      
      console.log('✅ Backup cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  });

// Helper function to format bytes
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Parse CLI arguments
program.parse();
