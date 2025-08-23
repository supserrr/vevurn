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

// ==========================================
// INVOICE & BILLING SYSTEM TYPES
// ==========================================

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  OVERDUE = 'OVERDUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum ReminderType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP'
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  saleId: string;
  customerId: string;
  
  // Invoice details
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  
  // Invoice status
  status: InvoiceStatus;
  
  // Dates
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  
  // Consignment specific
  isConsignment: boolean;
  consignmentDue?: number;
  
  // Communication
  emailSent: boolean;
  emailSentAt?: string;
  smsSent: boolean;
  smsSentAt?: string;
  
  // Payment terms
  paymentTerms?: string;
  notes?: string;
  
  // Tracking
  createdAt: string;
  updatedAt: string;
  
  // Relations
  sale?: Sale;
  customer?: Customer;
  reminders?: InvoiceReminder[];
}

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  
  // Reminder details
  type: ReminderType;
  message: string;
  
  // Status
  sent: boolean;
  sentAt?: string;
  
  // Scheduling
  scheduledFor: string;
  
  createdAt: string;
  
  // Relations
  invoice?: Invoice;
}

export interface CreateInvoiceRequest {
  saleId: string;
  customerId: string;
  dueDate: string;
  paymentTerms?: string;
  notes?: string;
  isConsignment?: boolean;
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  amountPaid?: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  customerId?: string;
  overdue?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CreateReminderRequest {
  invoiceId: string;
  type: ReminderType;
  message: string;
  scheduledFor: string;
}

// Extended Customer interface for billing
export interface CustomerWithBilling extends Customer {
  companyName?: string;
  taxNumber?: string;
  billingAddress?: string;
  paymentTerms?: string;
  creditLimit?: number;
  invoices?: Invoice[];
}

// Extended Sale interface for invoicing
export interface SaleWithInvoice extends Sale {
  isInvoiced: boolean;
  invoice?: Invoice;
}

// Invoice summary/statistics
export interface InvoiceSummary {
  total: number;
  draft: number;
  sent: number;
  overdue: number;
  partiallyPaid: number;
  paid: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
}
