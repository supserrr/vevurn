import { z } from 'zod';
import { idSchema, positiveIntSchema, nonNegativeIntSchema, decimalSchema } from './common.schemas';

export const inventoryMovementSchema = z.object({
  productId: idSchema,
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'TRANSFER', 'DAMAGED', 'EXPIRED']),
  quantity: z.number().int(), // Can be negative for stock out
  unitPrice: decimalSchema.optional(),
  referenceType: z.enum(['SALE', 'PURCHASE', 'ADJUSTMENT', 'REFUND']).optional(),
  referenceId: idSchema.optional(),
  reason: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: idSchema,
  newQuantity: nonNegativeIntSchema,
  reason: z.string().min(1).max(200),
  notes: z.string().max(500).optional(),
});

export const transferStockSchema = z.object({
  fromProductId: idSchema,
  toProductId: idSchema,
  quantity: positiveIntSchema,
  reason: z.string().max(200),
  notes: z.string().max(500).optional(),
});
