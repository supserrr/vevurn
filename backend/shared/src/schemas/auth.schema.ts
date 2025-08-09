// Zod validation schemas for authentication
import { z } from 'zod'
import { UserRole } from '../constants'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
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
