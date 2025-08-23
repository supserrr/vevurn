import { z } from 'zod';

// Common validations
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

// Auth validations
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phoneNumber: phoneSchema.optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Product validations
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  supplierId: z.string().optional(),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  wholesalePrice: z.number().min(0, 'Wholesale price must be positive'),
  retailPrice: z.number().min(0, 'Retail price must be positive'),
  minPrice: z.number().min(0, 'Minimum price must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be a positive integer'),
  minStockLevel: z.number().int().min(0, 'Minimum stock level must be a positive integer'),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
}).refine(data => data.costPrice <= data.wholesalePrice, {
  message: "Cost price must be less than or equal to wholesale price",
  path: ['wholesalePrice'],
}).refine(data => data.wholesalePrice <= data.retailPrice, {
  message: "Wholesale price must be less than or equal to retail price", 
  path: ['retailPrice'],
}).refine(data => data.minPrice <= data.retailPrice, {
  message: "Minimum price must be less than or equal to retail price",
  path: ['minPrice'],
});

// Customer validations
export const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  notes: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone number is required',
});

// Sale validations
export const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productVariationId: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  discountAmount: z.number().min(0, 'Discount must be positive').optional(),
});

export const saleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

// Payment validations
export const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT']),
  momoPhoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
  if (data.method === 'MOBILE_MONEY' && !data.momoPhoneNumber) {
    return false;
  }
  return true;
}, {
  message: 'Phone number is required for mobile money payments',
  path: ['momoPhoneNumber'],
}).refine(data => {
  if (data.method === 'BANK_TRANSFER' && !data.bankAccount) {
    return false;
  }
  return true;
}, {
  message: 'Bank account is required for bank transfer payments',
  path: ['bankAccount'],
});

// Settings validations
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Current password is required to change password',
  path: ['currentPassword'],
}).refine(data => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type SaleFormData = z.infer<typeof saleSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
