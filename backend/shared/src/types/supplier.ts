// Supplier types
import { Currency } from '../constants'

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  
  // Address
  address?: SupplierAddress
  
  // Business details
  taxId?: string
  registrationNumber?: string
  website?: string
  
  // Financial
  preferredCurrency: Currency
  paymentTerms?: string
  creditLimit?: number
  
  // Performance tracking
  totalOrders: number
  totalValue: number
  averageDeliveryTime: number // in days
  qualityRating: number // 1-5 scale
  
  // Status
  isActive: boolean
  isVerified: boolean
  
  // Audit
  createdAt: Date
  updatedAt: Date
  lastOrderAt?: Date
}

export interface SupplierAddress {
  street?: string
  city?: string
  state?: string
  country: string
  postalCode?: string
}
