// Product and inventory types
import { User } from './auth'
import { Currency, ProductCategory } from '../constants'

export interface Product {
  id: string
  name: string
  description?: string
  category: ProductCategory
  brand?: string
  model?: string
  sku: string
  barcode?: string
  
  // Pricing (multi-currency)
  prices: ProductPrice[]
  
  // Inventory
  currentStock: number
  minStock: number
  maxStock?: number
  reorderPoint: number
  
  // Physical attributes
  weight?: number
  dimensions?: ProductDimensions
  color?: string
  
  // Images
  imageUrls: string[]
  
  // Supplier
  supplierId?: string
  
  // Status
  isActive: boolean
  isDiscontinued: boolean
  
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

export interface ProductPrice {
  id: string
  productId: string
  currency: Currency
  costPrice: number
  sellingPrice: number
  markup: number
  isDefault: boolean
  effectiveFrom: Date
  effectiveTo?: Date
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'inch'
}

// Inventory movement tracking
export interface InventoryMovement {
  id: string
  productId: string
  type: MovementType
  quantity: number
  reason: string
  referenceId?: string // Sale ID, Purchase ID, etc.
  referenceType?: string
  
  // Cost tracking
  unitCost?: number
  totalCost?: number
  currency: Currency
  
  // User tracking
  performedBy: string
  
  // Timestamps
  createdAt: Date
}

export enum MovementType {
  IN = 'IN',           // Stock incoming
  OUT = 'OUT',         // Stock outgoing
  ADJUSTMENT = 'ADJUSTMENT', // Manual adjustment
  TRANSFER = 'TRANSFER',     // Transfer between locations
  DAMAGED = 'DAMAGED',       // Damaged goods
  EXPIRED = 'EXPIRED',       // Expired items
  RETURNED = 'RETURNED'      // Customer returns
}

export interface StockAlert {
  id: string
  productId: string
  type: AlertType
  currentStock: number
  threshold: number
  isResolved: boolean
  createdAt: Date
  resolvedAt?: Date
}

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  OVERSTOCK = 'OVERSTOCK'
}
