import { PrismaClient } from '@prisma/client';
import { paymentService } from './payment.service';

const prisma = new PrismaClient();

export interface CreateSaleData {
  customerId?: string;
  items: Array<{
    productId: string;
    productVariationId?: string;
    quantity: number;
    unitPrice: number;
    productName: string;
    productSku: string;
  }>;
  payments?: Array<{
    method: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
    amount: number;
    phoneNumber?: string; // For mobile money
  }>;
  discountAmount?: number;
  notes?: string;
}

export class SalesService {
  async createSale(cashierId: string, saleData: CreateSaleData) {
    // Calculate totals
    const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * 0.18; // Rwanda VAT
    const discountAmount = saleData.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    return await prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          saleNumber: await this.generateSaleNumber(),
          customerId: saleData.customerId,
          cashierId,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          status: 'DRAFT',
          items: {
            create: await Promise.all(saleData.items.map(async (item) => {
              // Get product data for cost calculation
              const product = await tx.product.findUnique({
                where: { id: item.productId }
              });
              
              if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
              }

              const unitCost = product.costPrice;
              const totalCost = unitCost.mul(item.quantity);

              return {
                productId: item.productId,
                productVariationId: item.productVariationId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
                unitCost,
                totalCost,
                productName: item.productName,
                productSku: item.productSku
              };
            }))
          }
        },
        include: {
          items: true,
          customer: true
        }
      });

      // Process payments if provided
      if (saleData.payments && saleData.payments.length > 0) {
        for (const payment of saleData.payments) {
          await this.processPayment(sale.id, payment);
        }
      }

      // Update inventory
      await this.updateInventory(tx, sale.id, saleData.items, cashierId);

      return sale;
    });
  }

  async processPayment(saleId: string, paymentData: any) {
    if (paymentData.method === 'MOBILE_MONEY') {
      return await paymentService.processPayment({
        saleId,
        amount: paymentData.amount,
        method: 'MOBILE_MONEY',
        momoPhoneNumber: paymentData.phoneNumber
      });
    }
    
    // Handle cash and other payment methods
    return await prisma.payment.create({
      data: {
        saleId,
        method: paymentData.method,
        amount: paymentData.amount,
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });
  }

  async getSalesSummary(startDate: Date, endDate: Date) {
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      },
      include: {
        payments: true
      }
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount.toNumber(), 0);
    const totalTax = sales.reduce((sum, sale) => sum + sale.taxAmount.toNumber(), 0);

    const paymentMethods = sales.reduce((acc, sale) => {
      sale.payments.forEach(payment => {
        acc[payment.method] = (acc[payment.method] || 0) + payment.amount.toNumber();
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSales,
      totalRevenue,
      totalTax,
      averageSaleAmount: totalRevenue / totalSales || 0,
      paymentMethods
    };
  }

  private async updateInventory(tx: any, saleId: string, items: any[], cashierId: string) {
    for (const item of items) {
      // Get current stock
      const currentStock = item.productVariationId 
        ? await tx.productVariation.findUnique({ where: { id: item.productVariationId } })
        : await tx.product.findUnique({ where: { id: item.productId } });

      const stockBefore = currentStock?.stockQuantity || 0;
      const stockAfter = stockBefore - item.quantity;

      // Update stock
      if (item.productVariationId) {
        await tx.productVariation.update({
          where: { id: item.productVariationId },
          data: { stockQuantity: stockAfter }
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: stockAfter }
        });
      }

      // Create inventory movement record
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: 'STOCK_OUT',
          quantity: -item.quantity,
          unitPrice: item.unitPrice,
          totalValue: item.quantity * item.unitPrice,
          referenceType: 'SALE',
          referenceId: saleId,
          reason: 'Sale transaction',
          stockBefore,
          stockAfter,
          createdBy: cashierId
        }
      });
    }
  }

  private async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await prisma.sale.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        }
      }
    });

    return `VEV-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }
}
