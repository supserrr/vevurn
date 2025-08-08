import { Request, Response } from 'express';
import { PricingService } from '../services/pricing.service';

/**
 * Controller for pricing and discount management
 */
export class PricingController {
  /**
   * Validate a proposed sale price
   * POST /api/pricing/validate
   */
  static async validatePrice(req: Request, res: Response) {
    try {
      const { productId, proposedPrice, staffId, currency = 'RWF', quantity = 1, reason } = req.body;

      if (!productId || !proposedPrice || !staffId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: productId, proposedPrice, staffId'
        });
      }

      const validation = await PricingService.validateSalePrice({
        productId,
        proposedPrice: parseFloat(proposedPrice),
        staffId,
        currency,
        quantity: parseInt(quantity),
        reason
      });

      return res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error validating price:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate price'
      });
    }
  }

  /**
   * Calculate maximum discount for a staff member on a product
   * GET /api/pricing/max-discount/:staffId/:productId
   */
  static async getMaxDiscount(req: Request, res: Response) {
    try {
      const { staffId, productId } = req.params;

      const maxDiscount = await PricingService.calculateMaxDiscount(staffId, productId);

      return res.json({
        success: true,
        data: { maxDiscount }
      });
    } catch (error) {
      console.error('Error getting max discount:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get maximum discount'
      });
    }
  }

  /**
   * Check if a sale requires manager approval
   * POST /api/pricing/check-approval
   */
  static async checkApprovalRequired(req: Request, res: Response) {
    try {
      const { items, staffId, currency = 'RWF' } = req.body;

      if (!items || !Array.isArray(items) || !staffId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: items (array), staffId'
        });
      }

      const approvalCheck = await PricingService.requiresManagerApproval(items, staffId, currency);

      return res.json({
        success: true,
        data: approvalCheck
      });
    } catch (error) {
      console.error('Error checking approval requirements:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check approval requirements'
      });
    }
  }

  /**
   * Apply bulk discount to multiple items
   * POST /api/pricing/bulk-discount
   */
  static async applyBulkDiscount(req: Request, res: Response) {
    try {
      const { items, discountPercentage, reason, staffId, currency = 'RWF' } = req.body;

      if (!items || !Array.isArray(items) || !discountPercentage || !staffId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: items, discountPercentage, staffId'
        });
      }

      const results = await PricingService.applyBulkDiscount({
        items,
        discountPercentage: parseFloat(discountPercentage),
        reason,
        staffId,
        currency
      });

      return res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error applying bulk discount:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to apply bulk discount'
      });
    }
  }

  /**
   * Get product pricing information
   * GET /api/pricing/product/:productId
   */
  static async getProductPricing(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const pricing = await PricingService.getProductPricing(productId);

      if (!pricing) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      return res.json({
        success: true,
        data: pricing
      });
    } catch (error) {
      console.error('Error getting product pricing:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get product pricing'
      });
    }
  }

  /**
   * Request discount approval
   * POST /api/pricing/request-approval
   */
  static async requestApproval(req: Request, res: Response) {
    try {
      const {
        requestedById,
        productId,
        basePrice,
        requestedPrice,
        minimumPrice,
        reason,
        customerContext,
        businessCase,
        currency = 'RWF',
        quantity = 1,
        saleId
      } = req.body;

      if (!requestedById || !productId || !basePrice || !requestedPrice || !minimumPrice || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: requestedById, productId, basePrice, requestedPrice, minimumPrice, reason'
        });
      }

      const approval = await PricingService.requestDiscountApproval({
        requestedById,
        productId,
        basePrice: parseFloat(basePrice),
        requestedPrice: parseFloat(requestedPrice),
        minimumPrice: parseFloat(minimumPrice),
        reason,
        customerContext,
        businessCase,
        currency,
        quantity: parseInt(quantity),
        saleId
      });

      return res.status(201).json({
        success: true,
        data: approval
      });
    } catch (error) {
      console.error('Error requesting approval:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to request approval'
      });
    }
  }

  /**
   * Get pending approvals
   * GET /api/pricing/approvals/pending
   */
  static async getPendingApprovals(req: Request, res: Response) {
    try {
      const { managerId } = req.query;

      const approvals = await PricingService.getPendingApprovals(managerId as string);

      return res.json({
        success: true,
        data: approvals
      });
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get pending approvals'
      });
    }
  }

  /**
   * Process an approval (approve/reject)
   * PUT /api/pricing/approvals/:approvalId
   */
  static async processApproval(req: Request, res: Response) {
    try {
      const { approvalId } = req.params;
      const { approverId, decision, notes } = req.body;

      if (!approverId || !decision || !['APPROVED', 'REJECTED'].includes(decision)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: approverId, decision (APPROVED/REJECTED)'
        });
      }

      const approval = await PricingService.processApproval(
        approvalId,
        approverId,
        decision,
        notes
      );

      return res.json({
        success: true,
        data: approval
      });
    } catch (error) {
      console.error('Error processing approval:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: error.message
          });
        }
        if (error.message.includes('already been processed')) {
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to process approval'
      });
    }
  }
}
