import { z } from 'zod';
import { emailSchema, phoneSchema, decimalSchema } from './common.schemas';

const baseCustomerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  preferredPaymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT']).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).optional().default([]),
});

export const createCustomerSchema = baseCustomerSchema.refine(data => data.email || data.phone, {
  message: "Either email or phone number is required",
});

export const updateCustomerSchema = baseCustomerSchema.partial();

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  preferredPaymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT']).optional(),
  tags: z.array(z.string()).optional(),
  minTotalSpent: decimalSchema.optional(),
  maxTotalSpent: decimalSchema.optional(),
});
