import { PaymentStatus, PaymentMethod, Payment, CreatePaymentRequest } from './payments';

// Sales Types
export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string;
  cashierId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  voidReason?: string;
  isVoided: boolean;
  voidedAt?: string;
  voidedBy?: string;
  shiftId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  customer?: Customer;
  cashier?: any; // User type from auth
  items?: SaleItem[];
  payments?: Payment[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  totalPrice: number;
  createdAt: string;
  
  // Relations
  sale?: Sale;
  product?: any; // Product type from products
}

export interface CreateSaleRequest {
  customerId?: string;
  items: CreateSaleItemRequest[];
  payments: CreatePaymentRequest[];
  discountAmount?: number;
  notes?: string;
}

export interface CreateSaleItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface VoidSaleRequest {
  reason: string;
  notes?: string;
}

export interface SaleSearchFilters {
  customerId?: string;
  cashierId?: string;
  paymentStatus?: PaymentStatus;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  minAmount?: number;
  maxAmount?: number;
  isVoided?: boolean;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchase?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  sales?: Sale[];
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  notes?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  loyaltyPoints?: number;
  isActive?: boolean;
}

export interface CustomerSearchFilters {
  hasEmail?: boolean;
  hasPhone?: boolean;
  city?: string;
  loyaltyPointsRange?: {
    min: number;
    max: number;
  };
  totalSpentRange?: {
    min: number;
    max: number;
  };
  lastPurchaseRange?: {
    startDate: string;
    endDate: string;
  };
  isActive?: boolean;
}

// Shift Types
export interface Shift {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashVariance?: number;
  totalSales: number;
  totalTransactions: number;
  status: ShiftStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user?: any; // User type from auth
  sales?: Sale[];
}

export enum ShiftStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface StartShiftRequest {
  openingCash: number;
  notes?: string;
}

export interface CloseShiftRequest {
  closingCash: number;
  notes?: string;
}

// Sale Summary Types
export interface SaleSummary {
  totalSales: number;
  totalAmount: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: TopProductSummary[];
  paymentMethodBreakdown: PaymentMethodSummary[];
}

export interface TopProductSummary {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface PaymentMethodSummary {
  method: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
}
