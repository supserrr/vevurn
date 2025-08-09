// Customer types
import { Currency, PaymentMethod, MembershipLevel } from '../constants'

export interface Customer {
  id: string
  customerNumber: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  
  // Address
  address?: CustomerAddress
  
  // Financial
  creditLimit: number
  currentCredit: number
  totalPurchases: number
  currency: Currency
  
  // Loyalty
  loyaltyPoints: number
  membershipLevel: MembershipLevel
  
  // Preferences
  preferredCurrency: Currency
  preferredPaymentMethod?: PaymentMethod
  
  // Photos (for identification)
  photoUrls: string[]
  
  // Status
  isActive: boolean
  isBlacklisted: boolean
  blacklistReason?: string
  
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastPurchaseAt?: Date
}

export interface CustomerAddress {
  street?: string
  city?: string
  district?: string
  province?: string
  country: string
  postalCode?: string
}
