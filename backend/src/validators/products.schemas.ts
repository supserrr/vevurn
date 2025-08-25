import { z } from 'zod';
import { idSchema, decimalSchema, positiveIntSchema, nonNegativeIntSchema } from './common.schemas';

const baseProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sku: z.string().min(1).max(50).optional(), // Auto-generated if not provided
  barcode: z.string().max(50).optional(),
  categoryId: idSchema,
  supplierId: idSchema.optional(),
  
  // Pricing
  costPrice: decimalSchema,
  wholesalePrice: decimalSchema,
  retailPrice: decimalSchema,
  minPrice: decimalSchema,
  
  // Inventory
  stockQuantity: nonNegativeIntSchema.optional().default(0),
  minStockLevel: nonNegativeIntSchema.optional().default(0),
  maxStockLevel: positiveIntSchema.optional(),
  reorderPoint: nonNegativeIntSchema.optional().default(0),
  
  // Product details
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  size: z.string().max(50).optional(),
  weight: decimalSchema.optional(),
  dimensions: z.string().max(100).optional(),
  
  // Metadata
  isConsignment: z.boolean().optional().default(false),
  consignmentRate: decimalSchema.optional(),
  tags: z.array(z.string().max(50)).optional().default([]),
});

export const createProductSchema = baseProductSchema.refine(data => {
  // Validate price hierarchy
  return data.minPrice <= data.wholesalePrice && 
         data.wholesalePrice <= data.retailPrice;
}, {
  message: "Price hierarchy must be: minPrice ≤ wholesalePrice ≤ retailPrice",
});

export const updateProductSchema = baseProductSchema.partial().omit({
  sku: true, // SKU cannot be updated
}).refine(data => {
  // Validate price hierarchy if prices are provided
  if (data.minPrice && data.wholesalePrice && data.retailPrice) {
    return data.minPrice <= data.wholesalePrice && 
           data.wholesalePrice <= data.retailPrice;
  }
  return true;
}, {
  message: "Price hierarchy must be: minPrice ≤ wholesalePrice ≤ retailPrice",
});

export const createProductVariationSchema = z.object({
  productId: idSchema,
  name: z.string().min(1).max(200),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  attributes: z.record(z.string(), z.any()), // Flexible JSON for attributes
  
  // Optional pricing overrides
  costPrice: decimalSchema.optional(),
  wholesalePrice: decimalSchema.optional(),
  retailPrice: decimalSchema.optional(),
  minPrice: decimalSchema.optional(),
  
  stockQuantity: nonNegativeIntSchema.optional().default(0),
});

export const updateStockSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export const productFilterSchema = z.object({
  categoryId: idSchema.optional(),
  supplierId: idSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
  minPrice: decimalSchema.optional(),
  maxPrice: decimalSchema.optional(),
  inStock: z.boolean().optional(),
  lowStock: z.boolean().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
