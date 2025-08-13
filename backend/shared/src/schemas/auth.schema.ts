// Zod validation schemas for authentication
import { z } from 'zod'
import { UserRole } from '../constants'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string()
    .min(1, "First name is required")
    .max(100, "First name cannot exceed 100 characters")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "First name cannot be empty"),
  lastName: z.string()
    .min(1, "Last name is required") 
    .max(100, "Last name cannot exceed 100 characters")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Last name cannot be empty"),
  role: z.nativeEnum(UserRole).default(UserRole.CASHIER)
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const ResetPasswordSchema = z.object({
  email: z.string().email()
})

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional()
})

export type LoginData = z.infer<typeof LoginSchema>
export type RegisterData = z.infer<typeof RegisterSchema>
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>
