import { z } from 'zod';

export const businessSetupSchema = z.object({
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name cannot exceed 100 characters'),
  tin: z.string()
    .optional()
    .refine(val => !val || val.length >= 9, 'TIN must be at least 9 characters if provided')
});

export const businessUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name cannot exceed 100 characters')
    .optional(),
  tin: z.string()
    .optional()
    .refine(val => !val || val.length >= 9, 'TIN must be at least 9 characters if provided')
});
