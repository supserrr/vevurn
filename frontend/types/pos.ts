// POS-specific types
export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  stockQuantity: number;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceType: 'retail' | 'wholesale';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'RETAIL' | 'WHOLESALE';
  totalPurchases: number;
  lastPurchase?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  icon: React.ComponentType<any>;
  description: string;
  enabled: boolean;
}
