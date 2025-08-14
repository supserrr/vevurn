export interface User {
  id: string;
  name: string;
  email: string;
  image?: string; // Added for profile image support
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  isActive: boolean;
  employeeId?: string;
  phoneNumber?: string;
  department?: string;
  hireDate?: string;
  lastLoginAt?: string;
  preferences?: UserPreferences; // Added user preferences
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  supplierId?: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  minPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isConsignment: boolean;
  consignmentRate?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  category?: Category;
  supplier?: Supplier;
  images?: ProductImage[];
  variations?: ProductVariation[];
  createdBy?: User;
  updatedBy?: User;
}

export interface ProductVariation {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, any>;
  costPrice?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  minPrice?: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  totalSpent: number;
  totalPurchases: number;
  lastPurchaseAt?: string;
  preferredPaymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT';
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string;
  cashierId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  changeAmount: number;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  notes?: string;
  receiptPrinted: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  customer?: Customer;
  cashier?: User;
  items?: SaleItem[];
  payments?: Payment[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productVariationId?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  isConsignment: boolean;
  consignmentRate?: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  productVariation?: ProductVariation;
}

export interface Payment {
  id: string;
  saleId?: string;
  amount: number;
  method: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  transactionId?: string;
  referenceNumber?: string;
  momoPhoneNumber?: string;
  bankAccount?: string;
  momoRequestId?: string;
  momoStatus?: string;
  changeGiven?: number;
  changeMethod?: 'CASH' | 'MOBILE_MONEY';
  notes?: string;
  receiptNumber?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  sale?: Sale;
}

export interface DashboardStats {
  todaySales: {
    count: number;
    amount: number;
  };
  monthSales: {
    count: number;
    amount: number;
  };
  lowStockProducts: number;
  totalCustomers: number;
  pendingPayments: {
    count: number;
    amount: number;
  };
  topProducts: Array<{
    product: Product;
    quantitySold: number;
    revenue: number;
  }>;
  salesChart: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: any;
}
