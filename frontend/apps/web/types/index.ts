// Re-export shared types for convenience
export type {
  Product,
  Customer,
  Sale,
  SaleItem,
  Payment,
  PaymentMethod,
  PaymentStatus,
  CreateSaleRequest,
  ApiResponse
} from '../../../../shared/src/types';

// Frontend-specific types
export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface PosProduct {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  currentStock: number;
  category?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  images: string[];
  isActive: boolean;
}

export interface CheckoutData {
  customerId?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  totalAmount: number;
  paidAmount: number;
  changeAmount?: number;
  momoPhone?: string;
  notes?: string;
}

export interface DashboardStats {
  todaySales: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockItems: number;
  recentSales: Sale[];
}

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  customerId?: string;
  cashierId?: string;
}

export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  inStock?: boolean;
  lowStock?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Error types
export interface FormError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: FormError[];
  status?: number;
}
