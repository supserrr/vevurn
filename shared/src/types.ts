// User types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER'
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  expiresIn: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId: string;
  unitPrice: number;
  costPrice: number;
  minStock: number;
  currentStock: number;
  reorderLevel: number;
  isActive: boolean;
  images: string[];
  specifications?: Record<string, any>;
  warranty?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  brand?: Brand;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId: string;
  unitPrice: number;
  costPrice: number;
  minStock?: number;
  reorderLevel?: number;
  images?: string[];
  specifications?: Record<string, any>;
  warranty?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string;
  unitPrice?: number;
  costPrice?: number;
  minStock?: number;
  currentStock?: number;
  reorderLevel?: number;
  isActive?: boolean;
  images?: string[];
  specifications?: Record<string, any>;
  warranty?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Brand types
export interface Brand {
  id: string;
  name: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

export interface CreateBrandRequest {
  name: string;
  logo?: string;
}

export interface UpdateBrandRequest {
  name?: string;
  logo?: string;
  isActive?: boolean;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  loyaltyPoints?: number;
  isActive?: boolean;
}

// Payment types
export enum PaymentMethod {
  CASH = 'CASH',
  MOMO_MTN = 'MOMO_MTN',
  MOMO_AIRTEL = 'MOMO_AIRTEL',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  momoPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Sales types
export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  createdAt: string;
  product?: Product;
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
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  momoReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  cashier?: User;
  items?: SaleItem[];
  payments?: Payment[];
}

export interface CreateSaleRequest {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  paymentMethod: PaymentMethod;
  momoPhone?: string;
  discountAmount?: number;
  notes?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Stock Movement types
export enum StockMovementType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  DAMAGED = 'DAMAGED',
  TRANSFER = 'TRANSFER'
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  product?: Product;
}

// Settings types
export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingRequest {
  value: string;
}

// Report types
export interface SalesReport {
  period: string;
  totalSales: number;
  totalAmount: number;
  averageTransactionValue: number;
  topProducts: {
    product: Product;
    quantitySold: number;
    revenue: number;
  }[];
  paymentMethodBreakdown: {
    method: PaymentMethod;
    count: number;
    amount: number;
  }[];
}

export interface InventoryReport {
  totalProducts: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  totalInventoryValue: number;
  categoryBreakdown: {
    category: Category;
    productCount: number;
    value: number;
  }[];
}

// Socket events
export interface SocketEvents {
  // Sales events
  'sale:created': Sale;
  'sale:updated': Sale;
  
  // Inventory events
  'inventory:low-stock': Product;
  'inventory:out-of-stock': Product;
  'inventory:updated': Product;
  
  // System events
  'system:notification': {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    data?: any;
  };
}
