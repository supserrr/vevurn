// Zod validation schemas for products
import { z } from 'zod'
import { Currency, ProductCategory } from '../constants'

export const ProductPriceSchema = z.object({
  currency: z.nativeEnum(Currency),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  markup: z.number().min(0),
  isDefault: z.boolean().default(false),
  effectiveFrom: z.date().default(() => new Date()),
  effectiveTo: z.date().optional()
})

export const ProductDimensionsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['cm', 'inch']).default('cm')
})

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.nativeEnum(ProductCategory),
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/i),
  barcode: z.string().regex(/^[0-9]{8,14}$/).optional(),
  
  // Pricing
  prices: z.array(ProductPriceSchema).min(1),
  
  // Inventory
  currentStock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).default(0),
  
  // Physical attributes
  weight: z.number().positive().optional(),
  dimensions: ProductDimensionsSchema.optional(),
  color: z.string().optional(),
  
  // Images
  imageUrls: z.array(z.string().url()).default([]),
  
  // Supplier
  supplierId: z.string().uuid().optional(),
  
  // Status
  isActive: z.boolean().default(true),
  isDiscontinued: z.boolean().default(false)
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  isActive: z.boolean().optional(),
  isDiscontinued: z.boolean().optional(),
  supplierId: z.string().uuid().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  currency: z.nativeEnum(Currency).optional(),
  inStock: z.boolean().optional(),
  lowStock: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'price', 'stock']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export const InventoryAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().min(1),
  reason: z.string().min(1).max(500),
  unitCost: z.number().min(0).optional(),
  currency: z.nativeEnum(Currency).optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional()
})

export type CreateProductData = z.infer<typeof CreateProductSchema>
export type UpdateProductData = z.infer<typeof UpdateProductSchema>
export type ProductQueryParams = z.infer<typeof ProductQuerySchema>
export type InventoryAdjustmentData = z.infer<typeof InventoryAdjustmentSchema>
