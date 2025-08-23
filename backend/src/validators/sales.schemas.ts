import { z } from 'zod';
import { idSchema, decimalSchema, positiveIntSchema } from './common.schemas';

export const createSaleItemSchema = z.object({
  productId: idSchema,
  productVariationId: idSchema.optional(),
  quantity: positiveIntSchema,
  unitPrice: decimalSchema,
  discountAmount: decimalSchema.optional().default(0),
  notes: z.string().max(200).optional(),
});

export const createSaleSchema = z.object({
  customerId: idSchema.optional(),
  items: z.array(createSaleItemSchema).min(1),
  subtotal: decimalSchema,
  taxAmount: decimalSchema.optional().default(0),
  discountAmount: decimalSchema.optional().default(0),
  totalAmount: decimalSchema,
  notes: z.string().max(500).optional(),
});

export const updateSaleItemSchema = z.object({
  quantity: positiveIntSchema.optional(),
  unitPrice: decimalSchema.optional(),
  discountAmount: decimalSchema.optional(),
  notes: z.string().max(200).optional(),
});

export const saleFilterSchema = z.object({
  customerId: idSchema.optional(),
  cashierId: idSchema.optional(),
  status: z.enum(['DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: decimalSchema.optional(),
  maxAmount: decimalSchema.optional(),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT']).optional(),
});

export const updateSaleSchema = z.object({
  status: z.enum(['DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  notes: z.string().max(500).optional(),
});

export const voidSaleSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});
