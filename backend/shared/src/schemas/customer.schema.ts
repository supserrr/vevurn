// Zod validation schemas for customers
import { z } from 'zod'
import { Currency, PaymentMethod, MembershipLevel } from '../constants'

export const CustomerAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  country: z.string().default('Rwanda'),
  postalCode: z.string().optional()
})

export const CreateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^(\+?250|0)?[0-9]{8,9}$/).optional(),
  
  // Address
  address: CustomerAddressSchema.optional(),
  
  // Financial
  creditLimit: z.number().min(0).default(0),
  currency: z.nativeEnum(Currency).default(Currency.RWF),
  
  // Preferences
  preferredCurrency: z.nativeEnum(Currency).default(Currency.RWF),
  preferredPaymentMethod: z.nativeEnum(PaymentMethod).optional(),
  
  // Photos
  photoUrls: z.array(z.string().url()).default([]),
  
  // Status
  isActive: z.boolean().default(true)
})

export const UpdateCustomerSchema = CreateCustomerSchema.partial()

export const CustomerQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  membershipLevel: z.nativeEnum(MembershipLevel).optional(),
  hasLoans: z.boolean().optional(),
  minTotalPurchases: z.number().min(0).optional(),
  maxTotalPurchases: z.number().min(0).optional(),
  currency: z.nativeEnum(Currency).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'totalPurchases', 'lastPurchase']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export const BlacklistCustomerSchema = z.object({
  reason: z.string().min(1).max(500)
})

export type CreateCustomerData = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerData = z.infer<typeof UpdateCustomerSchema>
export type CustomerQueryParams = z.infer<typeof CustomerQuerySchema>
export type BlacklistCustomerData = z.infer<typeof BlacklistCustomerSchema>
