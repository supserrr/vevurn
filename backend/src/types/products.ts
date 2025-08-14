/**
 * Product-related types for the backend
 */

import { ProductStatus, Prisma } from '@prisma/client';

export interface CreateProductRequest {
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
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: string;
  tags?: string[];
  isConsignment?: boolean;
  consignmentRate?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  supplierId?: string;
  costPrice?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  minPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: string;
  status?: ProductStatus;
  tags?: string[];
  isConsignment?: boolean;
  consignmentRate?: number;
}

export interface ProductSearchFilters {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  model?: string;
  tags?: string[];
  lowStock?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// For Prisma queries
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    supplier: true;
    variations: true;
    images: true;
    createdBy: { select: { id: true; name: true; email: true } };
    updatedBy: { select: { id: true; name: true; email: true } };
  };
}>;

export type ProductCreateData = Prisma.ProductCreateInput;
export type ProductUpdateData = Prisma.ProductUpdateInput;
