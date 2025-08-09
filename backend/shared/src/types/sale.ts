// Sales transaction types
import { Currency, PaymentMethod } from '../constants'
import { Product } from './product'
import { Customer } from './customer'
import { User } from './auth'
import { PaymentStatus } from './payment'

export interface Sale {
  id: string
  saleNumber: string
  
  // Customer
  customerId?: string
  customer?: Customer
  customerName?: string // For walk-in customers
  
  // Items
  items: SaleItem[]
  
  // Financial
  subtotal: number
  tax: number
  discount: number
  total: number
  currency: Currency
  
  // Payment
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentReference?: string // MoMo transaction ID, etc.
  
  // Staff
  cashierId: string
  cashier?: User
  supervisorId?: string // For approvals
  supervisor?: User
  
  // Receipt
  receiptNumber: string
  receiptUrl?: string
  
  // Status
  status: SaleStatus
  
  // Audit
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  voidedAt?: Date
  voidReason?: string
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  product?: Product
  
  // Quantities
  quantity: number
  
  // Pricing
  unitPrice: number
  discount: number
  total: number
  currency: Currency
  
  // Cost tracking (for profit calculation)
  unitCost?: number
  totalCost?: number
}

export enum SaleStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  VOIDED = 'VOIDED',
  RETURNED = 'RETURNED'
}

// Sales return types
export interface SaleReturn {
  id: string
  returnNumber: string
  originalSaleId: string
  originalSale?: Sale
  
  // Items being returned
  items: SaleReturnItem[]
  
  // Financial
  subtotal: number
  tax: number
  total: number
  currency: Currency
  
  // Reason
  reason: ReturnReason
  notes?: string
  
  // Processing
  processedBy: string
  processedByUser?: User
  status: ReturnStatus
  
  // Refund
  refundMethod: PaymentMethod
  refundReference?: string
  
  // Audit
  createdAt: Date
  processedAt?: Date
}

export interface SaleReturnItem {
  id: string
  returnId: string
  originalItemId: string
  productId: string
  product?: Product
  
  // Quantities
  quantityReturned: number
  
  // Pricing
  unitPrice: number
  total: number
  currency: Currency
  
  // Condition
  condition: ItemCondition
  reason?: string
}

export enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  CUSTOMER_CHANGED_MIND = 'CUSTOMER_CHANGED_MIND',
  DAMAGED_IN_SHIPPING = 'DAMAGED_IN_SHIPPING',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  OTHER = 'OTHER'
}

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED'
}

export enum ItemCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  DAMAGED = 'DAMAGED',
  UNUSABLE = 'UNUSABLE'
}
