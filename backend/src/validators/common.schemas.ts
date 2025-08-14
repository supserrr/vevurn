import { z } from 'zod';
import { isValidRwandaPhoneNumber } from '../utils/helpers';

// Common validation patterns
export const idSchema = z.string().cuid();
export const emailSchema = z.string().email().toLowerCase();
export const phoneSchema = z.string().refine(isValidRwandaPhoneNumber, {
  message: 'Invalid Rwanda phone number format',
});

export const decimalSchema = z.union([
  z.number().nonnegative(),
  z.string().regex(/^\d+(\.\d{1,2})?$/).transform(val => parseFloat(val)),
]);

export const positiveIntSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(val => parseInt(val)),
]);

export const nonNegativeIntSchema = z.union([
  z.number().int().nonnegative(),
  z.string().regex(/^\d+$/).transform(val => parseInt(val)),
]);

export const paginationSchema = z.object({
  page: z.union([z.string(), z.number()]).optional().default(1),
  limit: z.union([z.string(), z.number()]).optional().default(20),
}).transform(data => ({
  page: Math.max(1, parseInt(data.page.toString())),
  limit: Math.min(100, Math.max(1, parseInt(data.limit.toString()))),
}));

export const searchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
