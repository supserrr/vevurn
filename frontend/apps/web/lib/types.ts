// Core Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'ADMIN' | 'CASHIER' | 'MANAGER';
  isActive: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Product Management Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category?: Category;
  basePrice: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  tags?: string[];
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
}

export interface ProductVariation {
  id: string;
  productId: string;
  name: string;
  sku: string;
  attributes: Record<string, any>;
  stockQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Management Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sales Management Types
export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product?: Product;
  productVariationId?: string;
  productVariation?: ProductVariation;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerId?: string;
  customer?: Customer;
  cashierId: string;
  cashier?: User;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  paymentReference?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface SalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    product: Product;
    quantitySold: number;
    revenue: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    revenue: number;
  }>;
}

// Settings Types
export interface SystemSettings {
  id: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  currency: string;
  taxRate: number;
  receiptFooter?: string;
  lowStockThreshold: number;
  autoGenerateSkus: boolean;
  enableLoyaltyProgram: boolean;
  loyaltyPointsPerRwf: number;
  updatedAt: Date;
}
