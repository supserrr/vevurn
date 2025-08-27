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

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  department?: string;
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

// Invoice Management Types
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
  issueDate: string | null;
  dueDate: string | null;
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
  type: ReminderType;
  message: string;
  sent: boolean;
  sentAt?: string;
  scheduledFor: string;
  createdAt: string;
  invoice?: Invoice;
}

export interface CreateInvoiceRequest {
  saleId: string;
  dueDate: string;
  paymentTerms?: string;
  notes?: string;
  sendEmail?: boolean;
  sendSms?: boolean;
}

export interface UpdateInvoiceRequest {
  dueDate?: string;
  paymentTerms?: string;
  notes?: string;
  status?: InvoiceStatus;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: InvoiceStatus[];
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'totalAmount' | 'invoiceNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceSummary {
  totalOutstanding: number;
  totalOverdue: number;
  countByStatus: Record<InvoiceStatus, number>;
  totalAmount: number;
  paidAmount: number;
}

export interface RecordPaymentRequest {
  amount: number;
  method: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT';
  transactionId?: string;
  notes?: string;
}

export interface CreateReminderRequest {
  type: ReminderType;
  scheduledFor: string;
  message: string;
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
  type: 'REGULAR' | 'WHOLESALE' | 'WALK_IN' | 'BUSINESS';
  companyName?: string;
  taxNumber?: string;
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
