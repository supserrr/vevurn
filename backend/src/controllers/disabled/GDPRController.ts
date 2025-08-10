import { Request, Response } from 'express';
import GDPRComplianceService from '../services/GDPRComplianceService';
import { logger } from '../utils/logger';
import { getClientIP } from '../utils/networkUtils';

// Extended interface for authenticated requests with proper typing
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    [key: string]: any;
  };
  session?: any;
  betterAuth?: {
    session: any;
    user: any;
  };
}

const gdprService = GDPRComplianceService.getInstance();

export class GDPRController {
  /**
   * Request data export (GDPR Article 20)
   */
  static async requestDataExport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, email } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Validate authorization - users can only request their own data or admins can request any
      if (user.role !== 'admin' && user.id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to request data export for this user'
        });
        return;
      }

      if (!userId || !email) {
        res.status(400).json({
          success: false,
          message: 'User ID and email are required'
        });
        return;
      }

      const exportRequest = await gdprService.requestDataExport(userId, email);

      res.status(200).json({
        success: true,
        message: 'Data export request created successfully',
        data: {
          requestId: exportRequest.id,
          status: exportRequest.status,
          requestedAt: exportRequest.requestedAt
        }
      });
    } catch (error) {
      logger.error('Error requesting data export:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create data export request'
      });
    }
  }

  /**
   * Get data export request status
   */
  static async getDataExportStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const exportRequest = await gdprService.getDataExportRequest(requestId);

      if (!exportRequest) {
        res.status(404).json({
          success: false,
          message: 'Export request not found'
        });
        return;
      }

      // Validate authorization
      if (user.role !== 'admin' && user.id !== exportRequest.userId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to view this export request'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: exportRequest
      });
    } catch (error) {
      logger.error('Error getting data export status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get export request status'
      });
    }
  }

  /**
   * Request data deletion (GDPR Article 17)
   */
  static async requestDataDeletion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, reason, immediate = false } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Validate authorization - users can only request deletion of their own data or admins can delete any
      if (user.role !== 'admin' && user.id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to request data deletion for this user'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      // Only admins can request immediate deletion
      if (immediate && user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Only administrators can request immediate deletion'
        });
        return;
      }

      const deletionRequest = await gdprService.requestDataDeletion(userId, reason, immediate);

      res.status(200).json({
        success: true,
        message: 'Data deletion request created successfully',
        data: {
          requestId: deletionRequest.id,
          status: deletionRequest.status,
          requestedAt: deletionRequest.requestedAt,
          scheduledFor: deletionRequest.scheduledFor
        }
      });
    } catch (error) {
      logger.error('Error requesting data deletion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create data deletion request'
      });
    }
  }

  /**
   * Cancel data deletion request
   */
  static async cancelDataDeletion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await gdprService.cancelDataDeletion(requestId, user.id);

      res.status(200).json({
        success: true,
        message: 'Data deletion request cancelled successfully'
      });
    } catch (error) {
      logger.error('Error cancelling data deletion:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Deletion request not found'
        });
        return;
      }

      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message.includes('Cannot cancel')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to cancel data deletion request'
      });
    }
  }

  /**
   * Get data deletion request status
   */
  static async getDataDeletionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const deletionRequest = await gdprService.getDataDeletionRequest(requestId);

      if (!deletionRequest) {
        res.status(404).json({
          success: false,
          message: 'Deletion request not found'
        });
        return;
      }

      // Validate authorization
      if (user.role !== 'admin' && user.id !== deletionRequest.userId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to view this deletion request'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: deletionRequest
      });
    } catch (error) {
      logger.error('Error getting data deletion status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get deletion request status'
      });
    }
  }

  /**
   * Record user consent
   */
  static async recordConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type, granted } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const ipAddress = getClientIP(req);
      const userAgent = req.get('User-Agent') || '';

      if (!type || typeof granted !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Consent type and granted status are required'
        });
        return;
      }

      const validTypes = ['marketing', 'analytics', 'cookies', 'data_processing'];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid consent type. Must be one of: ' + validTypes.join(', ')
        });
        return;
      }

      const consent = await gdprService.recordConsent(
        user.id,
        type,
        granted,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: 'Consent recorded successfully',
        data: consent
      });
    } catch (error) {
      logger.error('Error recording consent:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record consent'
      });
    }
  }

  /**
   * Get user consents
   */
  static async getUserConsents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Users can only view their own consents, admins can view any
      if (user.role !== 'admin' && user.id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to view consents for this user'
        });
        return;
      }

      const consents = await gdprService.getUserConsents(userId);

      res.status(200).json({
        success: true,
        data: consents
      });
    } catch (error) {
      logger.error('Error getting user consents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user consents'
      });
    }
  }

  /**
   * Set retention policy (Admin only)
   */
  static async setRetentionPolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const policy = req.body;

      if (!policy?.category || !policy?.retentionDays) {
        res.status(400).json({
          success: false,
          message: 'Category and retention days are required'
        });
        return;
      }

      if (typeof policy.retentionDays !== 'number' || policy.retentionDays < 1) {
        res.status(400).json({
          success: false,
          message: 'Retention days must be a positive number'
        });
        return;
      }

      await gdprService.setRetentionPolicy(policy);

      res.status(200).json({
        success: true,
        message: 'Retention policy set successfully'
      });
    } catch (error) {
      logger.error('Error setting retention policy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set retention policy'
      });
    }
  }

  /**
   * Apply retention policies manually (Admin only)
   */
  static async applyRetentionPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await gdprService.applyRetentionPolicies();

      res.status(200).json({
        success: true,
        message: 'Retention policies applied successfully'
      });
    } catch (error) {
      logger.error('Error applying retention policies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply retention policies'
      });
    }
  }

  /**
   * Get GDPR compliance information
   */
  static async getComplianceInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const info = {
        gdprCompliance: {
          version: '1.0',
          lastUpdated: '2024-08-10',
          supportedRights: [
            'Right to Information (Article 13-14)',
            'Right of Access (Article 15)',
            'Right to Rectification (Article 16)', 
            'Right to Erasure (Article 17)',
            'Right to Restrict Processing (Article 18)',
            'Right to Data Portability (Article 20)',
            'Right to Object (Article 21)'
          ],
          dataProcessingPurposes: [
            'Transaction processing',
            'Customer service',
            'Legal compliance',
            'Security monitoring',
            'Business analytics (with consent)'
          ],
          dataRetentionPolicies: {
            customerData: '7 years (legal requirement)',
            transactionData: '10 years (tax compliance)',
            auditLogs: 'Configurable per category',
            consentRecords: 'Until withdrawn + 3 years'
          },
          contactInformation: {
            dataProtectionOfficer: process.env.DPO_EMAIL || 'dpo@vevurn.com',
            privacyInquiries: process.env.PRIVACY_EMAIL || 'privacy@vevurn.com',
            address: process.env.COMPANY_ADDRESS || 'Rwanda'
          }
        }
      };

      res.status(200).json({
        success: true,
        data: info
      });
    } catch (error) {
      logger.error('Error getting compliance info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get compliance information'
      });
    }
  }
}

export default GDPRController;
