import { Request, Response, NextFunction } from 'express';
import { BusinessService } from '../services/business.service';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class BusinessController {
  async setupBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { businessName, tin } = req.body;
      const logo = req.file;

      const business = await BusinessService.setupBusiness(userId, {
        businessName,
        tin,
        logo
      });

      res.status(201).json(
        ApiResponse.success('Business setup completed successfully', business)
      );
    } catch (error) {
      next(error);
    }
  }

  async getBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      
      if (!businessId) {
        return res.status(400).json(
          ApiResponse.error('No business associated with user')
        );
      }

      const business = await BusinessService.getBusiness(businessId);

      res.json(
        ApiResponse.success('Business details retrieved', business)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      
      if (!businessId) {
        return res.status(400).json(
          ApiResponse.error('No business associated with user')
        );
      }

      const { name, tin } = req.body;
      const logo = req.file;

      const business = await BusinessService.updateBusiness(businessId, {
        name,
        tin,
        logo
      });

      res.json(
        ApiResponse.success('Business updated successfully', business)
      );
    } catch (error) {
      next(error);
    }
  }
}
