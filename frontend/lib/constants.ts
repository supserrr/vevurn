export const APP_CONFIG = {
  name: 'Vevurn POS',
  description: 'Point of Sale System for Phone Accessories',
  version: '1.0.0',
  currency: 'RWF',
  timezone: 'Africa/Kigali',
  locale: 'en-RW',
} as const;

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

// Navigation items
export const NAVIGATION = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    description: 'Overview of your business',
  },
  {
    title: 'POS',
    href: '/pos',
    icon: 'Calculator',
    description: 'Point of Sale interface',
  },
  {
    title: 'Sales',
    href: '/sales',
    icon: 'ShoppingCart',
    description: 'Create and manage sales',
    children: [
      { title: 'New Sale', href: '/sales/new' },
      { title: 'All Sales', href: '/sales' },
      { title: 'Receipts', href: '/sales/receipts' },
    ],
  },
  {
    title: 'Products',
    href: '/products',
    icon: 'Package',
    description: 'Manage your inventory',
    children: [
      { title: 'All Products', href: '/products' },
      { title: 'Add Product', href: '/products/new' },
      { title: 'Categories', href: '/categories' },
      { title: 'Stock Levels', href: '/products/stock' },
    ],
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: 'Users',
    description: 'Customer management',
    children: [
      { title: 'All Customers', href: '/customers' },
      { title: 'Add Customer', href: '/customers/new' },
      { title: 'Loyalty & Credit', href: '/loyalty-credit' },
    ],
  },
  {
    title: 'Payments',
    href: '/payments',
    icon: 'CreditCard',
    description: 'Payment processing',
    children: [
      { title: 'All Payments', href: '/payments' },
      { title: 'Mobile Money', href: '/payments/momo' },
      { title: 'Bank Transfers', href: '/payments/bank' },
    ],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
    description: 'Business analytics',
    children: [
      { title: 'Sales Report', href: '/reports/sales' },
      { title: 'Profit Analysis', href: '/reports/profit' },
      { title: 'Inventory Report', href: '/reports/inventory' },
      { title: 'Customer Analysis', href: '/reports/customers' },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
    description: 'System configuration',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { title: 'General', href: '/settings' },
      { title: 'Users', href: '/settings/users' },
      { title: 'System', href: '/settings/system' },
    ],
  },
] as const;

// Product categories
export const PRODUCT_CATEGORIES = [
  'Phone Cases',
  'Screen Protectors',
  'Camera Protectors',
  'Chargers',
  'Earphones',
  'AirPods',
  'Power Banks',
  'Cables',
  'Phone Stands',
  'Other Accessories',
] as const;

// Popular phone models in Rwanda
export const PHONE_MODELS = [
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

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  WITH_TIME: 'MMM dd, yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
} as const;

// Business rules
export const BUSINESS_RULES = {
  MIN_CASH_CHANGE: 50, // Minimum change amount in RWF
  TAX_RATE: 0.18, // 18% VAT in Rwanda
  STOCK_WARNING_THRESHOLD: 10, // Show warning when stock is below this
  AUTO_LOGOUT_TIME: 30 * 60 * 1000, // 30 minutes in milliseconds
} as const;
