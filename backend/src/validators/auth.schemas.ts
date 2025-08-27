import { z } from 'zod';

export const createCashierSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().optional()
});