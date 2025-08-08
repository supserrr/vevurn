import { database } from './DatabaseService';

export type Currency = 'RWF' | 'USD' | 'EUR';

export interface PricingValidationResult {
  isValid: boolean;
  requiresApproval: boolean;
  reason?: string;
  maxAllowedPrice?: number;
  minAllowedPrice?: number;
}

export interface DiscountValidationOptions {
  productId: string;
  proposedPrice: number;
  staffId: string;
  currency: Currency;
  quantity?: number;
  reason?: string;
}

export interface BulkDiscountOptions {
  items: Array<{
    productId: string;
    quantity: number;
    basePrice: number;
  }>;
  discountPercentage: number;
  reason: string;
  staffId: string;
  currency: Currency;
}

export class PricingService {
  private static get prisma() {
    return database.getClient();
  }

  /**
   * Validate if a proposed price is acceptable for a given product and staff member
   */
  static async validateSalePrice(options: DiscountValidationOptions): Promise<PricingValidationResult> {
    const { productId, proposedPrice, staffId, currency } = options;

    // Get product pricing information
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        basePriceRwf: true,
        minPriceRwf: true,
        basePriceUsd: true,
        minPriceUsd: true,
        basePriceEur: true,
        minPriceEur: true,
        maxDiscountPercent: true,
        name: true,
        sku: true
      }
    });

    if (!product) {
      return {
        isValid: false,
        requiresApproval: false,
        reason: 'Product not found'
      };
    }

    // Get staff discount permissions
    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: {
        maxDiscountAllowed: true,
        canSellBelowMin: true,
        role: true
      }
    });

    if (!staff) {
      return {
        isValid: false,
        requiresApproval: false,
        reason: 'Staff member not found'
      };
    }

    // Get prices based on currency
    let basePrice: number;
    let minPrice: number;

    switch (currency) {
      case 'USD':
        basePrice = product.basePriceUsd || 0;
        minPrice = product.minPriceUsd || 0;
        break;
      case 'EUR':
        basePrice = product.basePriceEur || 0;
        minPrice = product.minPriceEur || 0;
        break;
      case 'RWF':
      default:
        basePrice = product.basePriceRwf || 0;
        minPrice = product.minPriceRwf || 0;
        break;
    }

    if (basePrice === 0) {
      return {
        isValid: false,
        requiresApproval: false,
        reason: `Product pricing not configured for ${currency}`
      };
    }

    // Calculate discount percentage
    const discountAmount = basePrice - proposedPrice;
    const discountPercentage = (discountAmount / basePrice) * 100;

    // Check if proposed price is higher than base price (not allowed)
    if (proposedPrice > basePrice) {
      return {
        isValid: false,
        requiresApproval: false,
        reason: 'Proposed price cannot be higher than base price'
      };
    }

    // Check if staff has permission for this discount percentage
    if (discountPercentage > staff.maxDiscountAllowed) {
      return {
        isValid: false,
        requiresApproval: true,
        reason: `Discount of ${discountPercentage.toFixed(1)}% exceeds staff limit of ${staff.maxDiscountAllowed}%`,
        maxAllowedPrice: basePrice * (1 - staff.maxDiscountAllowed / 100)
      };
    }

    // Check if below minimum price
    if (proposedPrice < minPrice) {
      if (!staff.canSellBelowMin) {
        return {
          isValid: false,
          requiresApproval: true,
          reason: `Proposed price (${proposedPrice}) is below minimum price (${minPrice})`,
          minAllowedPrice: minPrice
        };
      }
    }

    // Check product-specific discount limits
    if (product.maxDiscountPercent > 0 && discountPercentage > product.maxDiscountPercent) {
      return {
        isValid: false,
        requiresApproval: true,
        reason: `Product discount limit of ${product.maxDiscountPercent}% exceeded`,
        maxAllowedPrice: basePrice * (1 - product.maxDiscountPercent / 100)
      };
    }

    return {
      isValid: true,
      requiresApproval: false
    };
  }

  /**
   * Calculate maximum discount a staff member can give
   */
  static async calculateMaxDiscount(staffId: string, productId: string): Promise<number> {
    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { maxDiscountAllowed: true }
    });

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { maxDiscountPercent: true }
    });

    if (!staff || !product) return 0;

    // Return the more restrictive limit
    if (product.maxDiscountPercent > 0) {
      return Math.min(staff.maxDiscountAllowed, product.maxDiscountPercent);
    }

    return staff.maxDiscountAllowed;
  }

  /**
   * Check if a sale requires manager approval
   */
  static async requiresManagerApproval(
    items: Array<{ productId: string; proposedPrice: number; quantity: number }>,
    staffId: string,
    currency: Currency
  ): Promise<{ requiresApproval: boolean; items: string[] }> {
    const itemsNeedingApproval: string[] = [];

    for (const item of items) {
      const validation = await this.validateSalePrice({
        productId: item.productId,
        proposedPrice: item.proposedPrice,
        staffId,
        currency,
        quantity: item.quantity
      });

      if (validation.requiresApproval) {
        itemsNeedingApproval.push(item.productId);
      }
    }

    return {
      requiresApproval: itemsNeedingApproval.length > 0,
      items: itemsNeedingApproval
    };
  }

  /**
   * Apply bulk discount to multiple items
   */
  static async applyBulkDiscount(options: BulkDiscountOptions): Promise<Array<{
    productId: string;
    originalPrice: number;
    discountedPrice: number;
    discountAmount: number;
    isValid: boolean;
    requiresApproval: boolean;
    reason?: string;
  }>> {
    const { items, discountPercentage, reason, staffId, currency } = options;
    const results = [];

    for (const item of items) {
      const discountedPrice = item.basePrice * (1 - discountPercentage / 100);
      
      const validation = await this.validateSalePrice({
        productId: item.productId,
        proposedPrice: discountedPrice,
        staffId,
        currency,
        quantity: item.quantity,
        reason
      });

      const result: {
        productId: string;
        originalPrice: number;
        discountedPrice: number;
        discountAmount: number;
        isValid: boolean;
        requiresApproval: boolean;
        reason?: string;
      } = {
        productId: item.productId,
        originalPrice: item.basePrice,
        discountedPrice,
        discountAmount: item.basePrice - discountedPrice,
        isValid: validation.isValid,
        requiresApproval: validation.requiresApproval || false
      };

      if (validation.reason) {
        result.reason = validation.reason;
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Get pricing information for a product in all supported currencies
   */
  static async getProductPricing(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        basePriceRwf: true,
        minPriceRwf: true,
        wholesalePriceRwf: true,
        basePriceUsd: true,
        minPriceUsd: true,
        wholesalePriceUsd: true,
        basePriceEur: true,
        minPriceEur: true,
        wholesalePriceEur: true,
        maxDiscountPercent: true
      }
    });

    if (!product) return null;

    return {
      ...product,
      currencies: {
        RWF: {
          basePrice: product.basePriceRwf,
          minPrice: product.minPriceRwf,
          wholesalePrice: product.wholesalePriceRwf
        },
        USD: {
          basePrice: product.basePriceUsd,
          minPrice: product.minPriceUsd,
          wholesalePrice: product.wholesalePriceUsd
        },
        EUR: {
          basePrice: product.basePriceEur,
          minPrice: product.minPriceEur,
          wholesalePrice: product.wholesalePriceEur
        }
      }
    };
  }

  /**
   * Create a discount approval request
   */
  static async requestDiscountApproval(options: {
    requestedById: string;
    productId: string;
    basePrice: number;
    requestedPrice: number;
    minimumPrice: number;
    reason: string;
    customerContext?: string;
    businessCase?: string;
    currency: Currency;
    quantity: number;
    saleId?: string;
  }) {
    const product = await this.prisma.product.findUnique({
      where: { id: options.productId },
      select: { name: true, sku: true }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const discountAmount = options.basePrice - options.requestedPrice;
    const discountPercent = (discountAmount / options.basePrice) * 100;

    return this.prisma.discountApproval.create({
      data: {
        requestedById: options.requestedById,
        saleId: options.saleId || null,
        productId: options.productId,
        productName: product.name,
        productSku: product.sku,
        basePrice: options.basePrice,
        requestedPrice: options.requestedPrice,
        minimumPrice: options.minimumPrice,
        discountAmount,
        discountPercent,
        reason: options.reason,
        customerContext: options.customerContext || null,
        businessCase: options.businessCase || null,
        currency: options.currency,
        quantity: options.quantity
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Get pending discount approvals for managers
   */
  static async getPendingApprovals(managerId?: string) {
    const where = managerId 
      ? { status: 'PENDING' as const, approvedBy: null }
      : { status: 'PENDING' as const };

    return this.prisma.discountApproval.findMany({
      where,
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Approve or reject a discount request
   */
  static async processApproval(
    approvalId: string,
    approverId: string,
    decision: 'APPROVED' | 'REJECTED',
    notes?: string
  ) {
    const approval = await this.prisma.discountApproval.findUnique({
      where: { id: approvalId }
    });

    if (!approval) {
      throw new Error('Approval request not found');
    }

    if (approval.status !== 'PENDING') {
      throw new Error('Approval request has already been processed');
    }

    return this.prisma.discountApproval.update({
      where: { id: approvalId },
      data: {
        status: decision,
        approvedBy: approverId,
        approvalNotes: notes || null,
        approvedAt: new Date()
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }
}
