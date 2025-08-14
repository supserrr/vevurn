import { z } from 'zod';
import { emailSchema, phoneSchema, decimalSchema } from './common.schemas';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: z.string().min(8).max(128),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional().default('CASHIER'),
  phoneNumber: phoneSchema.optional(),
  department: z.string().max(100).optional(),
  salary: decimalSchema.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
  phoneNumber: phoneSchema.optional(),
  department: z.string().max(100).optional(),
  salary: decimalSchema.optional(),
  isActive: z.boolean().optional(),
});

export const changeUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
});

export const userFilterSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});
