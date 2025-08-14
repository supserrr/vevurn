import { z } from 'zod';
import { emailSchema, phoneSchema } from './common.schemas';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: z.string().min(8).max(128),
  phoneNumber: phoneSchema.optional(),
  department: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phoneNumber: phoneSchema.optional(),
  image: z.string().url().optional(),
});
