import { z } from 'zod';
import { idSchema } from './common.schemas';

export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "Start date must be before end date",
});

export const salesReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  cashierId: idSchema.optional(),
  customerId: idSchema.optional(),
  categoryId: idSchema.optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export const inventoryReportSchema = z.object({
  categoryId: idSchema.optional(),
  supplierId: idSchema.optional(),
  lowStock: z.boolean().optional(),
  includeInactive: z.boolean().optional().default(false),
});

export const profitAnalysisSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  productId: idSchema.optional(),
  categoryId: idSchema.optional(),
  groupBy: z.enum(['product', 'category', 'day', 'month']).optional().default('product'),
});

export const exportSchema = z.object({
  format: z.enum(['excel', 'pdf', 'csv']).default('excel'),
  reportType: z.enum(['sales', 'inventory', 'customers', 'profit']),
  filters: z.record(z.any()).optional(),
});
