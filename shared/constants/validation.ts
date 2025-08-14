// Validation Constants and Rules

// Password Requirements
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: false,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  COMMON_PASSWORDS: [
    'password',
    '123456789',
    'qwerty',
    'admin123',
    'password123',
  ],
} as const;

// Field Length Limits
export const FIELD_LENGTHS = {
  // User fields
  USERNAME: { MIN: 3, MAX: 50 },
  EMAIL: { MIN: 5, MAX: 255 },
  NAME: { MIN: 1, MAX: 100 },
  PHONE: { MIN: 10, MAX: 15 },
  
  // Product fields
  PRODUCT_NAME: { MIN: 1, MAX: 200 },
  PRODUCT_DESCRIPTION: { MIN: 0, MAX: 1000 },
  SKU: { MIN: 1, MAX: 50 },
  BARCODE: { MIN: 8, MAX: 50 },
  
  // Category/Brand fields
  CATEGORY_NAME: { MIN: 1, MAX: 100 },
  BRAND_NAME: { MIN: 1, MAX: 100 },
  DESCRIPTION: { MIN: 0, MAX: 500 },
  
  // Customer fields
  CUSTOMER_NAME: { MIN: 1, MAX: 200 },
  ADDRESS: { MIN: 0, MAX: 500 },
  CITY: { MIN: 0, MAX: 100 },
  
  // General fields
  NOTES: { MIN: 0, MAX: 1000 },
  REFERENCE: { MIN: 0, MAX: 100 },
  URL: { MIN: 0, MAX: 2048 },
  
  // Settings
  SETTING_KEY: { MIN: 1, MAX: 100 },
  SETTING_VALUE: { MIN: 0, MAX: 5000 },
} as const;

// Numeric Limits
export const NUMERIC_LIMITS = {
  // Price and Money
  PRICE: { MIN: 0, MAX: 999999999.99 },
  DISCOUNT: { MIN: 0, MAX: 100 }, // Percentage
  TAX_RATE: { MIN: 0, MAX: 100 }, // Percentage
  
  // Inventory
  STOCK_QUANTITY: { MIN: 0, MAX: 999999999 },
  MIN_STOCK: { MIN: 0, MAX: 99999 },
  REORDER_LEVEL: { MIN: 0, MAX: 99999 },
  
  // Loyalty
  LOYALTY_POINTS: { MIN: 0, MAX: 999999999 },
  POINTS_MULTIPLIER: { MIN: 0.01, MAX: 100 },
  
  // Pagination
  PAGE_SIZE: { MIN: 1, MAX: 100 },
  PAGE_NUMBER: { MIN: 1, MAX: 999999 },
  
  // General
  SORT_ORDER: { MIN: 0, MAX: 9999 },
  PERCENTAGE: { MIN: 0, MAX: 100 },
  RATING: { MIN: 1, MAX: 5 },
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  // Basic patterns
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_RWANDA: /^(\+?25)?(078|072|073|079)[0-9]{7}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Product patterns
  SKU: /^[A-Z0-9\-_]{1,50}$/,
  BARCODE_EAN13: /^[0-9]{13}$/,
  BARCODE_EAN8: /^[0-9]{8}$/,
  BARCODE_UPC: /^[0-9]{12}$/,
  
  // Text patterns
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  USERNAME: /^[a-zA-Z0-9_]{3,50}$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  
  // Number patterns
  CURRENCY: /^\d+(\.\d{1,2})?$/,
  INTEGER: /^[0-9]+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
  PERCENTAGE: /^(100|[1-9]?[0-9])$/,
  
  // Special patterns
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  CUID: /^c[a-z0-9]{24}$/,
} as const;

// File Validation
export const FILE_VALIDATION = {
  IMAGE: {
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MIN_WIDTH: 100,
    MAX_WIDTH: 4000,
    MIN_HEIGHT: 100,
    MAX_HEIGHT: 4000,
  },
  DOCUMENT: {
    ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
  },
  SPREADSHEET: {
    ALLOWED_TYPES: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
  },
} as const;

// Form Validation Messages
export const VALIDATION_MESSAGES = {
  // Required fields
  REQUIRED: 'This field is required',
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  
  // Length validation
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  LENGTH_BETWEEN: (min: number, max: number) => `Must be between ${min} and ${max} characters`,
  
  // Numeric validation
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be no more than ${max}`,
  POSITIVE_NUMBER: 'Must be a positive number',
  WHOLE_NUMBER: 'Must be a whole number',
  
  // Format validation
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_DATE: 'Please enter a valid date',
  
  // Business validation
  INVALID_PRICE: 'Please enter a valid price',
  INVALID_DISCOUNT: 'Discount must be between 0 and 100%',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  DUPLICATE_VALUE: 'This value already exists',
  
  // File validation
  FILE_TOO_LARGE: (maxSize: string) => `File size must be less than ${maxSize}`,
  INVALID_FILE_TYPE: (allowedTypes: string) => `File type must be one of: ${allowedTypes}`,
  
  // Custom validation
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password is too weak',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is locked',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
} as const;

// Validation Rules for Common Fields
export const VALIDATION_RULES = {
  EMAIL: {
    required: true,
    pattern: REGEX_PATTERNS.EMAIL,
    minLength: FIELD_LENGTHS.EMAIL.MIN,
    maxLength: FIELD_LENGTHS.EMAIL.MAX,
  },
  PHONE: {
    required: false,
    pattern: REGEX_PATTERNS.PHONE_RWANDA,
    minLength: FIELD_LENGTHS.PHONE.MIN,
    maxLength: FIELD_LENGTHS.PHONE.MAX,
  },
  PASSWORD: {
    required: true,
    minLength: PASSWORD_RULES.MIN_LENGTH,
    maxLength: PASSWORD_RULES.MAX_LENGTH,
  },
  PRICE: {
    required: true,
    min: NUMERIC_LIMITS.PRICE.MIN,
    max: NUMERIC_LIMITS.PRICE.MAX,
    pattern: REGEX_PATTERNS.CURRENCY,
  },
  STOCK: {
    required: true,
    min: NUMERIC_LIMITS.STOCK_QUANTITY.MIN,
    max: NUMERIC_LIMITS.STOCK_QUANTITY.MAX,
    pattern: REGEX_PATTERNS.INTEGER,
  },
} as const;
