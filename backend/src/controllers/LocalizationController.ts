import { Request, Response } from 'express';
import LocalizationService from '../services/LocalizationService';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

const localizationService = LocalizationService.getInstance();

export class LocalizationController {
  /**
   * Get user's localization configuration
   */
  static async getUserConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const config = localizationService.getUserConfig(userId);
      
      res.json({
        success: true,
        config
      });
    } catch (error) {
      logger.error('Failed to get user localization config:', error);
      res.status(500).json({ error: 'Failed to get localization configuration' });
    }
  }

  /**
   * Update user's localization configuration
   */
  static async updateUserConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const config = req.body;

      // Validate config
      if (config.locale && !localizationService.getSupportedLocales().find(l => l.code === config.locale)) {
        res.status(400).json({ error: 'Unsupported locale' });
        return;
      }

      if (config.currency && !localizationService.getSupportedCurrencies().find(c => c.code === config.currency)) {
        res.status(400).json({ error: 'Unsupported currency' });
        return;
      }

      if (config.timezone && !localizationService.getSupportedTimezones().find(t => t.code === config.timezone)) {
        res.status(400).json({ error: 'Unsupported timezone' });
        return;
      }

      localizationService.setUserConfig(userId, config);
      
      logger.info(`User ${userId} updated localization config:`, config);
      
      res.json({
        success: true,
        message: 'Localization configuration updated successfully',
        config: localizationService.getUserConfig(userId)
      });
    } catch (error) {
      logger.error('Failed to update user localization config:', error);
      res.status(500).json({ error: 'Failed to update localization configuration' });
    }
  }

  /**
   * Get supported locales
   */
  static async getSupportedLocales(req: Request, res: Response): Promise<void> {
    try {
      const locales = localizationService.getSupportedLocales();
      
      res.json({
        success: true,
        locales
      });
    } catch (error) {
      logger.error('Failed to get supported locales:', error);
      res.status(500).json({ error: 'Failed to get supported locales' });
    }
  }

  /**
   * Get supported currencies
   */
  static async getSupportedCurrencies(req: Request, res: Response): Promise<void> {
    try {
      const currencies = localizationService.getSupportedCurrencies();
      
      res.json({
        success: true,
        currencies
      });
    } catch (error) {
      logger.error('Failed to get supported currencies:', error);
      res.status(500).json({ error: 'Failed to get supported currencies' });
    }
  }

  /**
   * Get supported timezones
   */
  static async getSupportedTimezones(req: Request, res: Response): Promise<void> {
    try {
      const timezones = localizationService.getSupportedTimezones();
      
      res.json({
        success: true,
        timezones
      });
    } catch (error) {
      logger.error('Failed to get supported timezones:', error);
      res.status(500).json({ error: 'Failed to get supported timezones' });
    }
  }

  /**
   * Format date for user
   */
  static async formatDate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { date, formatType, customFormat } = req.body;

      if (!date) {
        res.status(400).json({ error: 'Date is required' });
        return;
      }

      const formatted = localizationService.formatDate(
        new Date(date),
        userId,
        formatType,
        customFormat
      );
      
      res.json({
        success: true,
        formatted
      });
    } catch (error) {
      logger.error('Failed to format date:', error);
      res.status(500).json({ error: 'Failed to format date' });
    }
  }

  /**
   * Format number for user
   */
  static async formatNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { value, options } = req.body;

      if (typeof value !== 'number') {
        res.status(400).json({ error: 'Value must be a number' });
        return;
      }

      const formatted = localizationService.formatNumber(value, userId, options);
      
      res.json({
        success: true,
        formatted
      });
    } catch (error) {
      logger.error('Failed to format number:', error);
      res.status(500).json({ error: 'Failed to format number' });
    }
  }

  /**
   * Parse localized number
   */
  static async parseNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { value, style } = req.body;

      if (typeof value !== 'string') {
        res.status(400).json({ error: 'Value must be a string' });
        return;
      }

      const parsed = localizationService.parseNumber(value, userId, style);
      
      res.json({
        success: true,
        parsed
      });
    } catch (error) {
      logger.error('Failed to parse number:', error);
      res.status(500).json({ error: 'Failed to parse number' });
    }
  }

  /**
   * Get localized day names
   */
  static async getDayNames(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { format } = req.query as { format?: 'long' | 'short' };
      const dayNames = localizationService.getDayNames(userId, format);
      
      res.json({
        success: true,
        dayNames
      });
    } catch (error) {
      logger.error('Failed to get day names:', error);
      res.status(500).json({ error: 'Failed to get day names' });
    }
  }

  /**
   * Get localized month names
   */
  static async getMonthNames(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { format } = req.query as { format?: 'long' | 'short' };
      const monthNames = localizationService.getMonthNames(userId, format);
      
      res.json({
        success: true,
        monthNames
      });
    } catch (error) {
      logger.error('Failed to get month names:', error);
      res.status(500).json({ error: 'Failed to get month names' });
    }
  }

  /**
   * Format duration
   */
  static async formatDuration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const formatted = localizationService.formatDuration(
        new Date(startDate),
        new Date(endDate),
        userId
      );
      
      res.json({
        success: true,
        formatted
      });
    } catch (error) {
      logger.error('Failed to format duration:', error);
      res.status(500).json({ error: 'Failed to format duration' });
    }
  }

  /**
   * Format address
   */
  static async formatAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const address = req.body;

      const formatted = localizationService.formatAddress(address, userId);
      
      res.json({
        success: true,
        formatted
      });
    } catch (error) {
      logger.error('Failed to format address:', error);
      res.status(500).json({ error: 'Failed to format address' });
    }
  }

  /**
   * Format phone number
   */
  static async formatPhoneNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { phone } = req.body;

      if (!phone) {
        res.status(400).json({ error: 'Phone number is required' });
        return;
      }

      const formatted = localizationService.formatPhoneNumber(phone, userId);
      
      res.json({
        success: true,
        formatted
      });
    } catch (error) {
      logger.error('Failed to format phone number:', error);
      res.status(500).json({ error: 'Failed to format phone number' });
    }
  }

  /**
   * Format file size
   */
  static async formatFileSize(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { bytes } = req.body;

      if (typeof bytes !== 'number') {
        res.status(400).json({ error: 'Bytes must be a number' });
        return;
      }

      const formatted = localizationService.formatFileSize(bytes, userId);
      
      res.json({
        success: true,
        formatted
      });
    } catch (error) {
      logger.error('Failed to format file size:', error);
      res.status(500).json({ error: 'Failed to format file size' });
    }
  }

  /**
   * Get validation rules for locale
   */
  static async getValidationRules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const rules = localizationService.getValidationRules(userId);
      
      // Convert RegExp to string for JSON response
      const serializedRules = {
        phone: rules.phone.source,
        postalCode: rules.postalCode.source,
        taxId: rules.taxId.source
      };
      
      res.json({
        success: true,
        rules: serializedRules
      });
    } catch (error) {
      logger.error('Failed to get validation rules:', error);
      res.status(500).json({ error: 'Failed to get validation rules' });
    }
  }

  /**
   * Get business hours for locale
   */
  static async getBusinessHours(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const businessHours = localizationService.getBusinessHours(userId);
      
      res.json({
        success: true,
        businessHours
      });
    } catch (error) {
      logger.error('Failed to get business hours:', error);
      res.status(500).json({ error: 'Failed to get business hours' });
    }
  }

  /**
   * Get error messages for locale
   */
  static async getErrorMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const messages = localizationService.getErrorMessages(userId);
      
      res.json({
        success: true,
        messages
      });
    } catch (error) {
      logger.error('Failed to get error messages:', error);
      res.status(500).json({ error: 'Failed to get error messages' });
    }
  }

  /**
   * Get text direction for locale
   */
  static async getTextDirection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const direction = localizationService.getTextDirection(userId);
      const isRTL = localizationService.isRTL(userId);
      
      res.json({
        success: true,
        direction,
        isRTL
      });
    } catch (error) {
      logger.error('Failed to get text direction:', error);
      res.status(500).json({ error: 'Failed to get text direction' });
    }
  }

  /**
   * Convert timezone
   */
  static async convertTimeZone(req: Request, res: Response): Promise<void> {
    try {
      const { date, fromTimeZone, toTimeZone } = req.body;

      if (!date || !fromTimeZone || !toTimeZone) {
        res.status(400).json({ error: 'Date, fromTimeZone, and toTimeZone are required' });
        return;
      }

      const converted = localizationService.convertTimeZone(
        new Date(date),
        fromTimeZone,
        toTimeZone
      );
      
      res.json({
        success: true,
        converted: {
          date: converted,
          iso: converted.toISOString(),
          timestamp: converted.getTime()
        }
      });
    } catch (error) {
      logger.error('Failed to convert timezone:', error);
      res.status(500).json({ error: 'Failed to convert timezone' });
    }
  }

  /**
   * Export complete localization data
   */
  static async exportLocalizationData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const data = localizationService.exportLocalizationData(userId);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Failed to export localization data:', error);
      res.status(500).json({ error: 'Failed to export localization data' });
    }
  }
}

export default LocalizationController;
