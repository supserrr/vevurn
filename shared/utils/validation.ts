import { z } from 'zod';
import { REGEX_PATTERNS, FIELD_LENGTHS, NUMERIC_LIMITS, PASSWORD_RULES } from '../constants/validation';

// Common validation schemas
export const idSchema = z.string().cuid('Invalid ID format');

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(FIELD_LENGTHS.EMAIL.MAX, `Email must be less than ${FIELD_LENGTHS.EMAIL.MAX} characters`);

export const phoneSchema = z
  .string()
  .regex(REGEX_PATTERNS.PHONE_RWANDA, 'Invalid Rwanda phone number format')
  .optional()
  .or(z.literal(''));

export const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.MIN_LENGTH, `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters`)
  .max(PASSWORD_RULES.MAX_LENGTH, `Password must be less than ${PASSWORD_RULES.MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(FIELD_LENGTHS.URL.MAX, `URL must be less than ${FIELD_LENGTHS.URL.MAX} characters`)
  .optional()
  .or(z.literal(''));

export const priceSchema = z
  .number()
  .min(NUMERIC_LIMITS.PRICE.MIN, `Price must be at least ${NUMERIC_LIMITS.PRICE.MIN}`)
  .max(NUMERIC_LIMITS.PRICE.MAX, `Price cannot exceed ${NUMERIC_LIMITS.PRICE.MAX}`);

export const quantitySchema = z
  .number()
  .int('Quantity must be a whole number')
  .min(0, 'Quantity cannot be negative')
  .max(NUMERIC_LIMITS.STOCK_QUANTITY.MAX, `Quantity cannot exceed ${NUMERIC_LIMITS.STOCK_QUANTITY.MAX}`);

export const discountSchema = z
  .number()
  .min(0, 'Discount cannot be negative')
  .max(NUMERIC_LIMITS.DISCOUNT.MAX, `Discount cannot exceed ${NUMERIC_LIMITS.DISCOUNT.MAX}%`);

export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100%');

// Date validation schemas
export const dateStringSchema = z.string().datetime('Invalid date format');

export const dateRangeSchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.number().int().min(1).max(NUMERIC_LIMITS.PAGE_SIZE.MAX).optional().default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().max(200).optional(),
});

// File validation schemas
export const imageFileSchema = z.object({
  name: z.string(),
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type),
    'File must be a valid image (JPEG, PNG, or WebP)'
  ),
  size: z.number().max(5 * 1024 * 1024, 'Image must be less than 5MB'),
});

// User validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  username: z.string()
    .min(FIELD_LENGTHS.USERNAME.MIN, `Username must be at least ${FIELD_LENGTHS.USERNAME.MIN} characters`)
    .max(FIELD_LENGTHS.USERNAME.MAX, `Username must be less than ${FIELD_LENGTHS.USERNAME.MAX} characters`)
    .regex(REGEX_PATTERNS.USERNAME, 'Username can only contain letters, numbers, and underscores'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(FIELD_LENGTHS.NAME.MAX, `First name must be less than ${FIELD_LENGTHS.NAME.MAX} characters`),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(FIELD_LENGTHS.NAME.MAX, `Last name must be less than ${FIELD_LENGTHS.NAME.MAX} characters`),
  phone: phoneSchema,
  password: passwordSchema,
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER']),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(FIELD_LENGTHS.PRODUCT_NAME.MAX, `Product name must be less than ${FIELD_LENGTHS.PRODUCT_NAME.MAX} characters`),
  description: z.string()
    .max(FIELD_LENGTHS.PRODUCT_DESCRIPTION.MAX, `Description must be less than ${FIELD_LENGTHS.PRODUCT_DESCRIPTION.MAX} characters`)
    .optional(),
  sku: z.string()
    .min(1, 'SKU is required')
    .max(FIELD_LENGTHS.SKU.MAX, `SKU must be less than ${FIELD_LENGTHS.SKU.MAX} characters`)
    .regex(REGEX_PATTERNS.SKU, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  barcode: z.string()
    .regex(REGEX_PATTERNS.BARCODE_EAN13, 'Barcode must be a valid EAN-13 format')
    .optional(),
  categoryId: idSchema,
  brandId: idSchema,
  unitPrice: priceSchema,
  costPrice: priceSchema,
  minStock: quantitySchema.optional(),
  reorderLevel: quantitySchema.optional(),
  images: z.array(z.string().url()).optional(),
  specifications: z.record(z.any()).optional(),
  warranty: z.string().max(200).optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['cm', 'in']),
  }).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  currentStock: quantitySchema.optional(),
  isActive: z.boolean().optional(),
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(FIELD_LENGTHS.CATEGORY_NAME.MAX, `Category name must be less than ${FIELD_LENGTHS.CATEGORY_NAME.MAX} characters`),
  description: z.string()
    .max(FIELD_LENGTHS.DESCRIPTION.MAX, `Description must be less than ${FIELD_LENGTHS.DESCRIPTION.MAX} characters`)
    .optional(),
  parentId: idSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  icon: z.string().max(50).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Brand validation schemas
export const createBrandSchema = z.object({
  name: z.string()
    .min(1, 'Brand name is required')
    .max(FIELD_LENGTHS.BRAND_NAME.MAX, `Brand name must be less than ${FIELD_LENGTHS.BRAND_NAME.MAX} characters`),
  description: z.string()
    .max(FIELD_LENGTHS.DESCRIPTION.MAX, `Description must be less than ${FIELD_LENGTHS.DESCRIPTION.MAX} characters`)
    .optional(),
  logo: urlSchema,
  website: urlSchema,
  sortOrder: z.number().int().min(0).optional(),
});

export const updateBrandSchema = createBrandSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Customer validation schemas
export const createCustomerSchema = z.object({
  name: z.string()
    .min(1, 'Customer name is required')
    .max(FIELD_LENGTHS.CUSTOMER_NAME.MAX, `Customer name must be less than ${FIELD_LENGTHS.CUSTOMER_NAME.MAX} characters`),
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: z.string()
    .max(FIELD_LENGTHS.ADDRESS.MAX, `Address must be less than ${FIELD_LENGTHS.ADDRESS.MAX} characters`)
    .optional(),
  city: z.string()
    .max(FIELD_LENGTHS.CITY.MAX, `City must be less than ${FIELD_LENGTHS.CITY.MAX} characters`)
    .optional(),
  dateOfBirth: dateStringSchema.optional(),
  notes: z.string()
    .max(FIELD_LENGTHS.NOTES.MAX, `Notes must be less than ${FIELD_LENGTHS.NOTES.MAX} characters`)
    .optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  loyaltyPoints: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Sales validation schemas
export const createSaleSchema = z.object({
  customerId: idSchema.optional(),
  items: z.array(
    z.object({
      productId: idSchema,
      quantity: quantitySchema.min(1, 'Quantity must be at least 1'),
      unitPrice: priceSchema,
      discount: discountSchema.optional().default(0),
    })
  ).min(1, 'At least one item is required'),
  payments: z.array(
    z.object({
      amount: priceSchema,
      method: z.enum(['CASH', 'MOMO_MTN', 'MOMO_AIRTEL', 'CARD', 'BANK_TRANSFER']),
      reference: z.string().max(FIELD_LENGTHS.REFERENCE.MAX).optional(),
      momoPhone: phoneSchema,
      notes: z.string().max(FIELD_LENGTHS.NOTES.MAX).optional(),
    })
  ).min(1, 'At least one payment method is required'),
  discountAmount: priceSchema.optional().default(0),
  notes: z.string()
    .max(FIELD_LENGTHS.NOTES.MAX, `Notes must be less than ${FIELD_LENGTHS.NOTES.MAX} characters`)
    .optional(),
});

// Payment validation schemas
export const momoPaymentSchema = z.object({
  amount: priceSchema,
  phone: z.string().regex(REGEX_PATTERNS.PHONE_RWANDA, 'Invalid phone number'),
  reference: z.string().max(FIELD_LENGTHS.REFERENCE.MAX).optional(),
  description: z.string().max(200).optional(),
});

// Settings validation schemas
export const updateSettingSchema = z.object({
  value: z.string()
    .min(1, 'Setting value is required')
    .max(FIELD_LENGTHS.SETTING_VALUE.MAX, `Setting value must be less than ${FIELD_LENGTHS.SETTING_VALUE.MAX} characters`),
});

// Helper function to validate phone number format
export function validatePhoneNumber(phone: string): boolean {
  return REGEX_PATTERNS.PHONE_RWANDA.test(phone);
}

// Helper function to validate email
export function validateEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email);
}

// Helper function to validate password strength
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  issues: string[];
  score: number;
} {
  const issues: string[] = [];
  let score = 0;

  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    issues.push(`Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters`);
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (PASSWORD_RULES.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    issues.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    score += 1;
  }

  if (PASSWORD_RULES.COMMON_PASSWORDS.some(common => password.toLowerCase() === common)) {
    issues.push('Password is too common');
    score = Math.max(0, score - 2);
  }

  return {
    isValid: issues.length === 0,
    issues,
    score,
  };
}
