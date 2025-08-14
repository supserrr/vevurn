// Business Constants for Rwanda

// Currency
export const CURRENCY = {
  CODE: 'RWF',
  SYMBOL: '₣',
  NAME: 'Rwandan Franc',
  DECIMAL_PLACES: 0,
  THOUSANDS_SEPARATOR: ',',
  DECIMAL_SEPARATOR: '.',
} as const;

// Tax Information
export const TAX = {
  VAT_RATE: 0.18, // 18% VAT in Rwanda
  VAT_LABEL: 'VAT',
  EXEMPT_THRESHOLD: 0, // No VAT exemption threshold
} as const;

// Phone Number Formats (Rwanda)
export const PHONE_FORMATS = {
  REGEX: /^(\+?25)?(078|072|073|079)[0-9]{7}$/,
  COUNTRY_CODE: '+250',
  MOBILE_PREFIXES: ['078', '072', '073', '079'],
  LENGTH: 10, // Local format
  INTERNATIONAL_LENGTH: 13, // With country code
} as const;

// Mobile Money Providers
export const MOMO_PROVIDERS = {
  MTN: {
    CODE: 'MTN',
    NAME: 'MTN Mobile Money',
    PREFIXES: ['078', '079'],
    MIN_AMOUNT: 100, // RWF
    MAX_AMOUNT: 2000000, // RWF
    FEES: {
      0: 0,      // 100-499 RWF
      500: 50,   // 500-999 RWF
      1000: 100, // 1000-4999 RWF
      5000: 200, // 5000-9999 RWF
      10000: 300, // 10000+ RWF
    },
  },
  AIRTEL: {
    CODE: 'AIRTEL',
    NAME: 'Airtel Money',
    PREFIXES: ['072', '073'],
    MIN_AMOUNT: 100, // RWF
    MAX_AMOUNT: 1500000, // RWF
    FEES: {
      0: 0,      // 100-499 RWF
      500: 50,   // 500-999 RWF
      1000: 100, // 1000-4999 RWF
      5000: 200, // 5000-9999 RWF
      10000: 300, // 10000+ RWF
    },
  },
} as const;

// Business Hours
export const BUSINESS_HOURS = {
  DEFAULT_OPEN: '08:00',
  DEFAULT_CLOSE: '20:00',
  TIMEZONE: 'Africa/Kigali',
  WORKING_DAYS: [1, 2, 3, 4, 5, 6], // Monday to Saturday
} as const;

// Languages
export const LANGUAGES = {
  EN: {
    CODE: 'en',
    NAME: 'English',
    NATIVE_NAME: 'English',
    RTL: false,
  },
  RW: {
    CODE: 'rw',
    NAME: 'Kinyarwanda',
    NATIVE_NAME: 'Ikinyarwanda',
    RTL: false,
  },
  FR: {
    CODE: 'fr',
    NAME: 'French',
    NATIVE_NAME: 'Français',
    RTL: false,
  },
} as const;

// Default Business Settings
export const BUSINESS_DEFAULTS = {
  COUNTRY: 'RW',
  CITY: 'Kigali',
  CURRENCY: CURRENCY.CODE,
  LANGUAGE: LANGUAGES.EN.CODE,
  TIMEZONE: BUSINESS_HOURS.TIMEZONE,
  TAX_RATE: TAX.VAT_RATE,
  RECEIPT_FOOTER: 'Thank you for your business!',
  LOW_STOCK_THRESHOLD: 10,
  REORDER_LEVEL: 20,
} as const;

// Product Categories (Phone Accessories)
export const DEFAULT_CATEGORIES = [
  {
    name: 'Phone Cases',
    description: 'Protective cases for smartphones',
    icon: 'smartphone-case',
  },
  {
    name: 'Screen Protectors',
    description: 'Tempered glass and film protectors',
    icon: 'shield',
  },
  {
    name: 'Chargers & Cables',
    description: 'Phone chargers and USB cables',
    icon: 'battery-charging',
  },
  {
    name: 'Power Banks',
    description: 'Portable power banks and battery packs',
    icon: 'battery-full',
  },
  {
    name: 'Earphones & Headphones',
    description: 'Wired and wireless audio accessories',
    icon: 'headphones',
  },
  {
    name: 'Phone Holders & Stands',
    description: 'Car mounts, desk stands, and holders',
    icon: 'smartphone-stand',
  },
  {
    name: 'Memory Cards',
    description: 'MicroSD cards and storage solutions',
    icon: 'sd-card',
  },
  {
    name: 'Bluetooth Accessories',
    description: 'Wireless speakers, keyboards, and mice',
    icon: 'bluetooth',
  },
] as const;

// Popular Phone Brands in Rwanda
export const DEFAULT_BRANDS = [
  'Samsung',
  'Tecno',
  'Infinix',
  'Oppo',
  'Vivo',
  'Huawei',
  'iPhone',
  'Xiaomi',
  'Realme',
  'Nokia',
  'Generic',
] as const;

// User Roles and Permissions
export const ROLES = {
  SUPER_ADMIN: {
    NAME: 'Super Admin',
    PERMISSIONS: ['*'], // All permissions
  },
  ADMIN: {
    NAME: 'Admin',
    PERMISSIONS: [
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'products.create',
      'products.read',
      'products.update',
      'products.delete',
      'sales.read',
      'sales.void',
      'reports.view',
      'settings.update',
    ],
  },
  MANAGER: {
    NAME: 'Manager',
    PERMISSIONS: [
      'products.create',
      'products.read',
      'products.update',
      'sales.read',
      'sales.create',
      'customers.create',
      'customers.read',
      'customers.update',
      'inventory.read',
      'inventory.adjust',
      'reports.view',
    ],
  },
  CASHIER: {
    NAME: 'Cashier',
    PERMISSIONS: [
      'products.read',
      'sales.create',
      'sales.read',
      'customers.create',
      'customers.read',
      'customers.update',
      'payments.process',
    ],
  },
} as const;

// Loyalty Program Defaults
export const LOYALTY_DEFAULTS = {
  POINTS_PER_RWF: 0.01, // 1 point per 100 RWF spent
  WELCOME_BONUS: 100, // Points for new customers
  BIRTHDAY_BONUS: 500, // Points on birthday
  REFERRAL_BONUS: 1000, // Points for successful referral
  MINIMUM_REDEMPTION: 1000, // Minimum points to redeem
  POINT_VALUE: 1, // 1 point = 1 RWF
} as const;

// Receipt Configuration
export const RECEIPT_CONFIG = {
  WIDTH: 80, // mm for thermal printer
  FONT_SIZE: {
    SMALL: 8,
    NORMAL: 10,
    LARGE: 12,
    TITLE: 14,
  },
  MARGINS: {
    TOP: 5,
    BOTTOM: 5,
    LEFT: 2,
    RIGHT: 2,
  },
  PAPER_TYPES: {
    THERMAL: '80mm',
    A4: '210mm',
  },
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  PRODUCT_IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_COUNT: 10,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
  PROFILE_AVATAR: {
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
    MAX_COUNT: 1,
    ALLOWED_TYPES: ['image/jpeg', 'image/png'],
  },
  IMPORT_FILE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_COUNT: 1,
    ALLOWED_TYPES: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
} as const;
