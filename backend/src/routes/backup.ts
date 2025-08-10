import { Router } from 'express';
import { BackupController } from '../controllers/BackupController';
import { authMiddleware } from '../middleware/auth';
import { roleMiddleware, permissionMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// All backup routes require authentication
router.use(authMiddleware);

// Create manual backup
router.post('/create', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.createBackup
);

// Get all backup configurations
router.get('/configs', 
  roleMiddleware(['admin', 'super_admin', 'manager']), 
  BackupController.getBackupConfigs
);

// Save backup configuration
router.post('/configs', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.saveBackupConfig
);

// Update backup configuration
router.put('/configs/:configId', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.saveBackupConfig
);

// Delete backup configuration
router.delete('/configs/:configId', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.deleteBackupConfig
);

// Test backup configuration
router.post('/configs/test', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.testBackupConfig
);

// Get backup history for a configuration
router.get('/history/:configId', 
  roleMiddleware(['admin', 'super_admin', 'manager']), 
  BackupController.getBackupHistory
);

// Get backup statistics
router.get('/stats', 
  roleMiddleware(['admin', 'super_admin', 'manager']), 
  BackupController.getBackupStats
);

// Verify backup integrity
router.post('/verify/:backupId', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.verifyBackup
);

// Restore from backup
router.post('/restore/:backupId', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.restoreFromBackup
);

// Create restore point
router.post('/restore-point', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.createRestorePoint
);

// Apply retention policies manually
router.post('/retention/apply', 
  roleMiddleware(['admin', 'super_admin']), 
  BackupController.applyRetentionPolicies
);

export default router;
