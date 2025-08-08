// =============================================
// TRANSACTION SERVICE
// =============================================

import { AuthService } from '../auth/authService.js';
import { ErrorService } from '../monitoring/errorService.js';
import { db } from '../database/database.js';
import crypto from 'crypto';

export class TransactionService {
  static async executeInTransaction(operations) {
    return await db.prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const operation of operations) {
        try {
          const result = await operation(tx);
          results.push(result);
        } catch (error) {
          console.error('Transaction operation failed:', error);
          throw error;
        }
      }
      
      return results;
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    });
  }

  static async createSaleTransaction(saleData) {
    try {
      const results = await this.executeInTransaction([
        // 1. Create the sale
        async (tx) => {
          const sale = await tx.sales.create({
            data: {
              ...saleData,
              receipt_number: await this.generateReceiptNumber(),
              transaction_hash: this.generateTransactionHash(saleData),
              created_by: saleData.staff_id
            }
          });

          return sale;
        },

        // 2. Create sale items
        async (tx) => {
          const saleItems = await Promise.all(
            saleData.items.map(async (item) => {
              return await tx.saleItems.create({
                data: {
                  sale_id: results[0].id, // From previous operation
                  product_id: item.product_id,
                  product_name: item.name,
                  product_sku: item.sku,
                  category: item.category,
                  quantity: item.quantity,
                  unit_cost: item.unit_cost,
                  unit_price: item.unit_price,
                  discount_amount: item.discount_amount || 0,
                  variations: item.variations || {}
                }
              });
            })
          );

          return saleItems;
        },

        // 3. Update inventory
        async (tx) => {
          const inventoryUpdates = await Promise.all(
            saleData.items.map(async (item) => {
              // Update product stock
              const product = await tx.products.update({
                where: { id: item.product_id },
                data: {
                  stock_quantity: { decrement: item.quantity },
                  updated_at: new Date(),
                  updated_by: saleData.staff_id,
                  version: { increment: 1 }
                }
              });

              // Create inventory movement record
              const movement = await tx.inventoryMovements.create({
                data: {
                  product_id: item.product_id,
                  movement_type: 'sale',
                  quantity: -item.quantity,
                  previous_quantity: product.stock_quantity + item.quantity,
                  new_quantity: product.stock_quantity,
                  reference_type: 'sale',
                  reference_id: results[0].id,
                  staff_id: saleData.staff_id,
                  reason: `Sale: ${results[0].receipt_number}`
                }
              });

              // Check for low stock alert
              if (product.stock_quantity <= product.low_stock_threshold) {
                await tx.stockAlerts.create({
                  data: {
                    product_id: item.product_id,
                    alert_type: product.stock_quantity === 0 ? 'out_of_stock' : 'low_stock',
                    current_stock: product.stock_quantity,
                    threshold_value: product.low_stock_threshold
                  }
                });
              }

              return { product, movement };
            })
          );

          return inventoryUpdates;
        },

        // 4. Handle MoMo payment if applicable
        async (tx) => {
          if (saleData.payment_method === 'momo') {
            const momoTransaction = await tx.momoTransactions.create({
              data: {
                sale_id: results[0].id,
                external_id: saleData.momo_external_id,
                request_id: saleData.momo_request_id,
                amount: saleData.total_amount,
                currency: saleData.currency,
                payer_phone: saleData.momo_payer_phone,
                payer_message: saleData.momo_payer_message,
                payee_note: saleData.momo_payee_note,
                status: 'pending'
              }
            });

            return momoTransaction;
          }
          return null;
        },

        // 5. Update business metrics
        async (tx) => {
          const today = new Date().toISOString().split('T')[0];
          const currentHour = new Date().getHours();

          return await tx.businessMetrics.upsert({
            where: {
              metric_date_metric_hour_staff_id: {
                metric_date: new Date(today),
                metric_hour: currentHour,
                staff_id: saleData.staff_id
              }
            },
            create: {
              metric_date: new Date(today),
              metric_hour: currentHour,
              staff_id: saleData.staff_id,
              total_sales_rwf: saleData.currency === 'RWF' ? saleData.total_amount : 0,
              total_sales_usd: saleData.currency === 'USD' ? saleData.total_amount : 0,
              total_sales_eur: saleData.currency === 'EUR' ? saleData.total_amount : 0,
              total_transactions: 1,
              [`${saleData.payment_method}_sales`]: saleData.total_amount,
              [`${saleData.payment_method}_transactions`]: 1,
              total_profit: saleData.profit || 0,
              products_sold: saleData.items.reduce((sum, item) => sum + item.quantity, 0)
            },
            update: {
              total_sales_rwf: saleData.currency === 'RWF' ? { increment: saleData.total_amount } : undefined,
              total_sales_usd: saleData.currency === 'USD' ? { increment: saleData.total_amount } : undefined,
              total_sales_eur: saleData.currency === 'EUR' ? { increment: saleData.total_amount } : undefined,
              total_transactions: { increment: 1 },
              [`${saleData.payment_method}_sales`]: { increment: saleData.total_amount },
              [`${saleData.payment_method}_transactions`]: { increment: 1 },
              total_profit: { increment: saleData.profit || 0 },
              products_sold: { increment: saleData.items.reduce((sum, item) => sum + item.quantity, 0) },
              updated_at: new Date()
            }
          });
        }
      ]);

      return results[0]; // Return the created sale
    } catch (error) {
      console.error('Sale transaction failed:', error);
      await ErrorService.logError(error, {
        component: 'transaction',
        operation: 'create_sale',
        context: { sale_data: saleData }
      });
      throw error;
    }
  }

  static async generateReceiptNumber() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = await this.getNextSequenceNumber('receipt', today);
    return `VEV-${today}-${sequence.toString().padStart(4, '0')}`;
  }

  static generateTransactionHash(saleData) {
    const data = JSON.stringify({
      items: saleData.items,
      total_amount: saleData.total_amount,
      timestamp: Date.now()
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static async getNextSequenceNumber(type, date) {
    const key = `sequence:${type}:${date}`;
    return await db.redis.incr(key);
  }
}
