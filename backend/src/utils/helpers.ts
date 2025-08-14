import { Decimal } from 'decimal.js';
import { BUSINESS_CONFIG } from './constants';

/**
 * Generate a unique sale number
 */
export function generateSaleNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SALE-${timestamp}-${random}`;
}

/**
 * Generate a unique purchase order number
 */
export function generatePurchaseOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PO-${timestamp}-${random}`;
}

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number | Decimal, taxRate: number = 0.18): Decimal {
  const baseAmount = new Decimal(amount);
  return baseAmount.mul(taxRate).toDecimalPlaces(2);
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  amount: number | Decimal,
  discountPercent: number | Decimal
): Decimal {
  const baseAmount = new Decimal(amount);
  const discount = new Decimal(discountPercent);
  return baseAmount.mul(discount).div(100).toDecimalPlaces(2);
}

/**
 * Format currency for Rwanda (RWF)
 */
export function formatCurrency(amount: number | Decimal): string {
  const value = new Decimal(amount).toNumber();
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parse phone number for Rwanda format
 */
export function parseRwandaPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.startsWith('250')) {
    return digits; // Already has country code
  } else if (digits.startsWith('0')) {
    return '250' + digits.substring(1); // Remove leading 0 and add country code
  } else if (digits.length === 9) {
    return '250' + digits; // Add country code to 9-digit number
  }
  
  return digits; // Return as-is if format is unclear
}

/**
 * Validate Rwanda phone number
 */
export function isValidRwandaPhoneNumber(phone: string): boolean {
  const cleanPhone = parseRwandaPhoneNumber(phone);
  // Rwanda phone numbers: +250 7XX XXX XXX or +250 2XX XXX XXX
  const rwandaPhoneRegex = /^250[27]\d{8}$/;
  return rwandaPhoneRegex.test(cleanPhone);
}

/**
 * Generate SKU for products
 */
export function generateSKU(category: string, brand?: string): string {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const brandCode = brand ? brand.substring(0, 3).toUpperCase() : 'GEN';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${categoryCode}-${brandCode}-${timestamp}-${random}`;
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(sellingPrice: number | Decimal, costPrice: number | Decimal): Decimal {
  const selling = new Decimal(sellingPrice);
  const cost = new Decimal(costPrice);
  
  if (cost.isZero()) return new Decimal(0);
  
  return selling.sub(cost).div(cost).mul(100).toDecimalPlaces(2);
}

/**
 * Round to nearest denomination for cash transactions
 */
export function roundToNearestDenomination(amount: number | Decimal, denomination: number = 50): Decimal {
  const value = new Decimal(amount);
  const rounded = Math.round(value.toNumber() / denomination) * denomination;
  return new Decimal(rounded);
}

/**
 * Check if business is open
 */
export function isBusinessOpen(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const openingHour = parseInt(BUSINESS_CONFIG.OPENING_HOURS.split(':')[0]);
  const closingHour = parseInt(BUSINESS_CONFIG.CLOSING_HOURS.split(':')[0]);
  
  return hour >= openingHour && hour < closingHour;
}

/**
 * Generate barcode (EAN-13 format)
 */
export function generateBarcode(): string {
  // Generate 12 random digits
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return code + checkDigit;
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>\"'%;()&+]/g, '') // Remove potentially dangerous characters
    .substring(0, 100); // Limit length
}

/**
 * Generate pagination offset
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * Math.max(1, limit);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: string | number, limit?: string | number) {
  const parsedPage = page ? parseInt(page.toString()) : 1;
  const parsedLimit = limit ? parseInt(limit.toString()) : 20;
  
  return {
    page: Math.max(1, parsedPage),
    limit: Math.min(100, Math.max(1, parsedLimit)), // Max 100 items per page
  };
}
