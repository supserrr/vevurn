// API Constants

// Base URLs
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    AVATAR: (id: string) => `/users/${id}/avatar`,
  },
  
  // Products
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    SEARCH: '/products/search',
    BARCODE: (barcode: string) => `/products/barcode/${barcode}`,
    UPLOAD_IMAGE: (id: string) => `/products/${id}/images`,
    LOW_STOCK: '/products/low-stock',
    OUT_OF_STOCK: '/products/out-of-stock',
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    TREE: '/categories/tree',
  },
  
  // Brands
  BRANDS: {
    BASE: '/brands',
    BY_ID: (id: string) => `/brands/${id}`,
  },
  
  // Customers
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id: string) => `/customers/${id}`,
    SEARCH: '/customers/search',
    LOYALTY: (id: string) => `/customers/${id}/loyalty`,
  },
  
  // Sales
  SALES: {
    BASE: '/sales',
    BY_ID: (id: string) => `/sales/${id}`,
    RECEIPT: (id: string) => `/sales/${id}/receipt`,
    VOID: (id: string) => `/sales/${id}/void`,
    REFUND: (id: string) => `/sales/${id}/refund`,
  },
  
  // Payments
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id: string) => `/payments/${id}`,
    MOMO_REQUEST: '/payments/momo/request',
    MOMO_STATUS: (transactionId: string) => `/payments/momo/status/${transactionId}`,
    REFUND: (id: string) => `/payments/${id}/refund`,
  },
  
  // Inventory
  INVENTORY: {
    MOVEMENTS: '/inventory/movements',
    ADJUST: '/inventory/adjust',
    TRANSFER: '/inventory/transfer',
    REPORTS: '/inventory/reports',
  },
  
  // Reports
  REPORTS: {
    SALES: '/reports/sales',
    INVENTORY: '/reports/inventory',
    CUSTOMERS: '/reports/customers',
    PAYMENTS: '/reports/payments',
    EXPORT: '/reports/export',
  },
  
  // Settings
  SETTINGS: {
    BASE: '/settings',
    BY_KEY: (key: string) => `/settings/${key}`,
    CATEGORIES: '/settings/categories',
  },
  
  // Webhooks
  WEBHOOKS: {
    MOMO_MTN: '/webhooks/momo/mtn',
    MOMO_AIRTEL: '/webhooks/momo/airtel',
    PAYMENT_STATUS: '/webhooks/payment/status',
  },
  
  // Health
  HEALTH: '/health',
  METRICS: '/metrics',
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// Request Headers
export const REQUEST_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  X_REQUEST_ID: 'X-Request-ID',
  X_API_VERSION: 'X-API-Version',
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  PDF: 'application/pdf',
  CSV: 'text/csv',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

// Response Codes
export const RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API Limits
export const API_LIMITS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_SEARCH_RESULTS: 1000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BATCH_SIZE: 100,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: (id: string) => `user:${id}`,
  PRODUCT: (id: string) => `product:${id}`,
  CATEGORY: (id: string) => `category:${id}`,
  BRAND: (id: string) => `brand:${id}`,
  CUSTOMER: (id: string) => `customer:${id}`,
  SETTINGS: 'settings:all',
  SETTING: (key: string) => `setting:${key}`,
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;
