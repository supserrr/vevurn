import { z } from 'zod';
import { UserRole, PaymentMethod, StockMovementType } from './types';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid user role' }) })
});

export const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters').optional(),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters').optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid user role' }) }).optional(),
  isActive: z.boolean().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  barcode: z.string().max(50, 'Barcode must be less than 50 characters').optional(),
  categoryId: z.string().cuid('Invalid category ID'),
  brandId: z.string().cuid('Invalid brand ID'),
  unitPrice: z.number().positive('Unit price must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  minStock: z.number().int().nonnegative('Minimum stock must be non-negative').optional(),
  reorderLevel: z.number().int().nonnegative('Reorder level must be non-negative').optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  specifications: z.record(z.any()).optional(),
  warranty: z.string().max(200, 'Warranty must be less than 200 characters').optional()
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name must be less than 200 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters').optional(),
  barcode: z.string().max(50, 'Barcode must be less than 50 characters').optional(),
  categoryId: z.string().cuid('Invalid category ID').optional(),
  brandId: z.string().cuid('Invalid brand ID').optional(),
  unitPrice: z.number().positive('Unit price must be positive').optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  minStock: z.number().int().nonnegative('Minimum stock must be non-negative').optional(),
  currentStock: z.number().int().nonnegative('Current stock must be non-negative').optional(),
  reorderLevel: z.number().int().nonnegative('Reorder level must be non-negative').optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  specifications: z.record(z.any()).optional(),
  warranty: z.string().max(200, 'Warranty must be less than 200 characters').optional()
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional()
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().optional()
});

// Brand validation schemas
export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100, 'Brand name must be less than 100 characters'),
  logo: z.string().url('Invalid logo URL').optional()
});

export const updateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100, 'Brand name must be less than 100 characters').optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  isActive: z.boolean().optional()
});

// Customer validation schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200, 'Customer name must be less than 200 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  dateOfBirth: z.string().datetime('Invalid date format').optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200, 'Customer name must be less than 200 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  dateOfBirth: z.string().datetime('Invalid date format').optional(),
  loyaltyPoints: z.number().int().nonnegative('Loyalty points must be non-negative').optional(),
  isActive: z.boolean().optional()
});

// Sale validation schemas
export const createSaleSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID').optional(),
  items: z.array(
    z.object({
      productId: z.string().cuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
      unitPrice: z.number().positive('Unit price must be positive'),
      discount: z.number().nonnegative('Discount must be non-negative').optional()
    })
  ).min(1, 'At least one item is required'),
  paymentMethod: z.nativeEnum(PaymentMethod, { errorMap: () => ({ message: 'Invalid payment method' }) }),
  momoPhone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  discountAmount: z.number().nonnegative('Discount amount must be non-negative').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

// Stock movement validation schemas
export const createStockMovementSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  type: z.nativeEnum(StockMovementType, { errorMap: () => ({ message: 'Invalid stock movement type' }) }),
  quantity: z.number().int('Quantity must be an integer'),
  reference: z.string().max(100, 'Reference must be less than 100 characters').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

// Settings validation schemas
export const updateSettingSchema = z.object({
  value: z.string().min(1, 'Setting value is required').max(1000, 'Setting value must be less than 1000 characters')
});

// Pagination validation schemas
export const paginationSchema = z.object({
  page: z.number().int().positive('Page must be a positive integer').optional(),
  limit: z.number().int().positive('Limit must be a positive integer').max(100, 'Limit cannot exceed 100').optional(),
  sortBy: z.string().max(50, 'Sort field must be less than 50 characters').optional(),
  sortOrder: z.enum(['asc', 'desc'], { errorMap: () => ({ message: 'Sort order must be "asc" or "desc"' }) }).optional(),
  search: z.string().max(200, 'Search query must be less than 200 characters').optional()
});

// Common ID validation
export const idSchema = z.string().cuid('Invalid ID format');
