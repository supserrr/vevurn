// Product Types
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
  specifications?: ProductSpecifications;
  warranty?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // Relations
  category?: Category;
  brand?: Brand;
  stockMovements?: StockMovement[];
  suppliers?: ProductSupplier[];
}

export interface ProductSpecifications {
  [key: string]: string | number | boolean;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
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
  specifications?: ProductSpecifications;
  warranty?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  tags?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  currentStock?: number;
  isActive?: boolean;
}

export interface ProductSearchFilters {
  categoryId?: string;
  brandId?: string;
  priceRange?: PriceRange;
  inStock?: boolean;
  lowStock?: boolean;
  isActive?: boolean;
  tags?: string[];
}

export interface PriceRange {
  min: number;
  max: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  parent?: Category;
  children?: Category[];
  products?: Product[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  icon?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  isActive?: boolean;
}

// Brand Types
export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  products?: Product[];
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  sortOrder?: number;
}

export interface UpdateBrandRequest extends Partial<CreateBrandRequest> {
  isActive?: boolean;
}

// Product Supplier Types
export interface ProductSupplier {
  id: string;
  productId: string;
  supplierId: string;
  supplierSku?: string;
  lastCost: number;
  isPreferred: boolean;
  leadTime: number;
  minOrderQuantity: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  product?: Product;
  supplier?: Supplier;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
  rating: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  products?: ProductSupplier[];
  purchaseOrders?: PurchaseOrder[];
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  purchaseOrder?: PurchaseOrder;
  product?: Product;
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

// Stock Movement Types
export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
  userId?: string;
  createdAt: string;
  
  // Relations
  product?: Product;
  user?: any; // User type from auth
}

export enum StockMovementType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  DAMAGED = 'DAMAGED',
  TRANSFER = 'TRANSFER',
  INITIAL = 'INITIAL',
}
