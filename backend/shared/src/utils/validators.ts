// Validation utility functions

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  // Rwandan phone number validation
  const cleaned = phone.replace(/\D/g, '')
  
  // Check for valid Rwandan phone number patterns
  const patterns = [
    /^250[0-9]{9}$/, // International: 250XXXXXXXXX
    /^0[0-9]{8}$/,   // Local: 0XXXXXXXX
    /^[0-9]{9}$/     // Without prefix: XXXXXXXXX
  ]
  
  return patterns.some(pattern => pattern.test(cleaned))
}

export function isValidSKU(sku: string): boolean {
  // SKU should be alphanumeric, can include dashes and underscores
  const skuRegex = /^[A-Z0-9_-]+$/i
  return sku.length >= 3 && sku.length <= 20 && skuRegex.test(sku)
}

export function isValidBarcode(barcode: string): boolean {
  // Basic barcode validation (UPC-A, EAN-13, etc.)
  const barcodeRegex = /^[0-9]{8,14}$/
  return barcodeRegex.test(barcode)
}

export function isValidPrice(price: number): boolean {
  return price >= 0 && price <= 999999999 && Number.isFinite(price)
}

export function isValidQuantity(quantity: number): boolean {
  return quantity >= 0 && Number.isInteger(quantity)
}

export function isValidPercentage(percentage: number): boolean {
  return percentage >= 0 && percentage <= 100 && Number.isFinite(percentage)
}

export function sanitizeInput(input: string): string {
  // Basic HTML sanitization - remove script tags and normalize
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
