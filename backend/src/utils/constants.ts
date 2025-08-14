export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT: 'CREDIT',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const SALE_STATUS = {
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DISCONTINUED: 'DISCONTINUED',
} as const;

export const MOVEMENT_TYPES = {
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
  DAMAGED: 'DAMAGED',
  EXPIRED: 'EXPIRED',
} as const;

export const TRANSACTION_TYPES = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  ADJUSTMENT: 'ADJUSTMENT',
  REFUND: 'REFUND',
} as const;

// Product categories for Rwanda phone accessories market
export const PRODUCT_CATEGORIES = {
  PHONE_CASES: 'Phone Cases',
  SCREEN_PROTECTORS: 'Screen Protectors',
  CAMERA_PROTECTORS: 'Camera Protectors',
  CHARGERS: 'Chargers',
  EARPHONES: 'Earphones',
  AIRPODS: 'AirPods',
  POWER_BANKS: 'Power Banks',
  CABLES: 'Cables',
  STANDS: 'Phone Stands',
  ACCESSORIES: 'Other Accessories',
} as const;

// Phone models popular in Rwanda
export const POPULAR_PHONE_MODELS = [
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15',
  'iPhone 14',
  'iPhone 13',
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S24',
  'Samsung Galaxy A54',
  'Samsung Galaxy A34',
  'Tecno Spark 10',
  'Infinix Hot 30',
  'Redmi Note 12',
  'Huawei P60',
  'Oppo A78',
  'Vivo Y36',
] as const;

// MTN Mobile Money configuration
export const MOMO_CONFIG = {
  SANDBOX_BASE_URL: 'https://sandbox.momodeveloper.mtn.co.rw/collection',
  PRODUCTION_BASE_URL: 'https://api.mtn.co.rw/collection',
  CURRENCY: 'RWF',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// Business hours and settings
export const BUSINESS_CONFIG = {
  OPENING_HOURS: '08:00',
  CLOSING_HOURS: '20:00',
  TIMEZONE: 'Africa/Kigali',
  CURRENCY: 'RWF',
  CURRENCY_SYMBOL: 'RWF',
  TAX_RATE: 0.18, // 18% VAT in Rwanda
  MIN_CASH_CHANGE: 50, // Minimum change amount in RWF
} as const;

// File upload settings
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  PRODUCT_IMAGE_DIMENSIONS: {
    THUMBNAIL: { width: 150, height: 150 },
    MEDIUM: { width: 400, height: 400 },
    LARGE: { width: 800, height: 800 },
  },
} as const;
