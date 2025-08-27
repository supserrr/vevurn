import { PrismaClient } from '@prisma/client';
import { createProductSchema, updateProductSchema } from '../validators/products.schemas';
import { NotFoundError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';
import { z } from 'zod';

const prisma = new PrismaClient();

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;

export class ProductsService {
  async getAllProducts(filters: any) {
    try {
      const where: any = {
        deletedAt: null,
      };

      // Apply filters
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.supplierId) where.supplierId = filters.supplierId;
      if (filters.status) where.status = filters.status;
      if (filters.brand) where.brand = { contains: filters.brand, mode: 'insensitive' };
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { barcode: { contains: filters.search } }
        ];
      }

      if (filters.inStock) {
        where.stockQuantity = { gt: 0 };
      }

      if (filters.lowStock) {
        where.stockQuantity = { lte: { reorderPoint: true } };
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
          variations: true,
          images: true,
          createdBy: { select: { id: true, name: true } },
          updatedBy: { select: { id: true, name: true } }
        },
        skip: filters.skip || 0,
        take: filters.limit || 20,
        orderBy: { 
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc' 
        }
      });

      const total = await prisma.product.count({ where });

      return { products, total };
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id, deletedAt: null },
        include: {
          category: true,
          supplier: true,
          variations: true,
          images: true,
          createdBy: { select: { id: true, name: true } },
          updatedBy: { select: { id: true, name: true } }
        }
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      return product;
    } catch (error) {
      logger.error('Error fetching product:', error);
      throw error;
    }
  }

  async createProduct(data: CreateProductSchema, userId: string) {
    try {
      // Check for SKU uniqueness if provided
      if (data.sku) {
        const existingSku = await prisma.product.findUnique({
          where: { sku: data.sku }
        });
        if (existingSku) {
          throw new ConflictError('SKU already exists');
        }
      }

      // Generate SKU if not provided
      const sku = data.sku || await this.generateUniqueSKU(data.name);

      const product = await prisma.product.create({
        data: {
          ...data,
          sku,
          createdById: userId,
          updatedById: userId,
          status: 'ACTIVE'
        },
        include: {
          category: true,
          supplier: true,
          createdBy: { select: { id: true, name: true } }
        }
      });

      logger.info('Product created successfully', { productId: product.id, sku: product.sku });
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, data: UpdateProductSchema, userId: string) {
    try {
      // Check if product exists
      await this.getProductById(id);

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...data,
          updatedById: userId,
          updatedAt: new Date()
        },
        include: {
          category: true,
          supplier: true,
          updatedBy: { select: { id: true, name: true } }
        }
      });

      logger.info('Product updated successfully', { productId: product.id });
      return product;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string) {
    try {
      // Check if product exists
      await this.getProductById(id);
      
      const product = await prisma.product.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          status: 'DISCONTINUED'
        }
      });

      logger.info('Product deleted successfully', { productId: product.id });
      return product;
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async updateStock(id: string, quantity: number, operation: 'ADD' | 'SUBTRACT' | 'SET') {
    try {
      const product = await this.getProductById(id);
      
      let newQuantity: number;
      switch (operation) {
        case 'ADD':
          newQuantity = product.stockQuantity + quantity;
          break;
        case 'SUBTRACT':
          newQuantity = product.stockQuantity - quantity;
          break;
        case 'SET':
          newQuantity = quantity;
          break;
        default:
          throw new Error('Invalid operation');
      }

      if (newQuantity < 0) {
        throw new ConflictError('Insufficient stock');
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { 
          stockQuantity: newQuantity,
          updatedAt: new Date()
        },
        include: {
          category: true
        }
      });

      logger.info('Product stock updated', { 
        productId: id, 
        operation, 
        quantity, 
        newQuantity 
      });

      return updatedProduct;
    } catch (error) {
      logger.error('Error updating product stock:', error);
      throw error;
    }
  }

  async searchProducts(query: string, limit: number = 10) {
    try {
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { barcode: { equals: query } }
          ]
        },
        include: {
          category: true,
          variations: true
        },
        take: limit,
        orderBy: { name: 'asc' }
      });

      return products;
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  async getLowStockProducts() {
    try {
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          stockQuantity: {
            lte: prisma.product.fields.reorderPoint
          }
        },
        include: {
          category: true,
          supplier: true
        },
        orderBy: { stockQuantity: 'asc' }
      });

      return products;
    } catch (error) {
      logger.error('Error fetching low stock products:', error);
      throw error;
    }
  }

  private async generateUniqueSKU(productName: string): Promise<string> {
    const prefix = productName
      .split(' ')
      .map(word => word.substring(0, 3).toUpperCase())
      .join('')
      .substring(0, 6);
    
    let suffix = 1;
    let sku: string;
    
    do {
      sku = `${prefix}-${suffix.toString().padStart(4, '0')}`;
      const existing = await prisma.product.findUnique({ where: { sku } });
      if (!existing) break;
      suffix++;
    } while (suffix < 9999);

    return sku;
  }

  async getProductCategories() {
    try {
      const categories = await prisma.category.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      return categories;
    } catch (error) {
      logger.error('Error fetching product categories:', error);
      throw error;
    }
  }
}

export const productsService = new ProductsService();
