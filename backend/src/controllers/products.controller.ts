import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ProductStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/better-auth.middleware';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { generateSKU, generateBarcode, validatePagination } from '../utils/helpers';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

export class ProductController {
  /**
   * Get products with filtering and pagination
   */
  async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        categoryId,
        supplierId,
        status,
        minPrice,
        maxPrice,
        inStock,
        lowStock,
        brand,
        tags,
        query,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as any;

      const { page: validPage, limit: validLimit } = validatePagination(page, limit);
      const offset = (validPage - 1) * validLimit;

      // Build where clause
      const where: any = {
        deletedAt: null, // Only active products
      };

      if (categoryId) where.categoryId = categoryId;
      if (supplierId) where.supplierId = supplierId;
      if (status) where.status = status as ProductStatus;
      if (brand) where.brand = { contains: brand, mode: 'insensitive' };
      if (tags && Array.isArray(tags)) where.tags = { hasSome: tags };

      if (minPrice || maxPrice) {
        where.retailPrice = {};
        if (minPrice) where.retailPrice.gte = new Decimal(minPrice);
        if (maxPrice) where.retailPrice.lte = new Decimal(maxPrice);
      }

      if (inStock) where.stockQuantity = { gt: 0 };
      if (lowStock) {
        // Get products where stock is at or below minimum stock level
        const lowStockCondition = {
          stockQuantity: {
            lte: prisma.$queryRaw`"minStockLevel"`
          }
        };
        Object.assign(where, lowStockCondition);
      }

      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
        ];
      }

      // Execute queries
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            supplier: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1, // Only include primary image for list view
            },
            variations: {
              where: { isActive: true },
              take: 3, // Limit variations in list view
            },
            _count: {
              select: { variations: true },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: validLimit,
        }),
        prisma.product.count({ where }),
      ]);

      res.json(
        ApiResponse.paginated(
          'Products retrieved successfully',
          products,
          validPage,
          validLimit,
          total
        )
      );
    } catch (error) {
      logger.error('Error getting products:', error);
      next(error);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          category: true,
          supplier: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          variations: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          updatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      res.json(
        ApiResponse.success('Product retrieved successfully', product)
      );
    } catch (error) {
      logger.error('Error getting product:', error);
      next(error);
    }
  }

  /**
   * Create new product
   */
  async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const productData = req.body;
      const userId = req.user!.id;

      // Generate SKU if not provided
      if (!productData.sku) {
        const category = await prisma.category.findUnique({
          where: { id: productData.categoryId },
        });
        productData.sku = generateSKU(category?.name || 'GENERAL', productData.brand);
      }

      // Generate barcode if not provided
      if (!productData.barcode) {
        productData.barcode = generateBarcode();
      }

      const product = await prisma.product.create({
        data: {
          ...productData,
          costPrice: new Decimal(productData.costPrice),
          wholesalePrice: new Decimal(productData.wholesalePrice),
          retailPrice: new Decimal(productData.retailPrice),
          minPrice: new Decimal(productData.minPrice),
          weight: productData.weight ? new Decimal(productData.weight) : null,
          consignmentRate: productData.consignmentRate ? new Decimal(productData.consignmentRate) : null,
          createdById: userId,
        },
        include: {
          category: true,
          supplier: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Log inventory movement for initial stock
      if (productData.stockQuantity > 0) {
        await prisma.inventoryMovement.create({
          data: {
            productId: product.id,
            type: 'STOCK_IN',
            quantity: productData.stockQuantity,
            unitPrice: new Decimal(productData.costPrice),
            totalValue: new Decimal(productData.costPrice).mul(productData.stockQuantity),
            referenceType: 'ADJUSTMENT',
            reason: 'Initial stock',
            stockBefore: 0,
            stockAfter: productData.stockQuantity,
            createdBy: userId,
          },
        });
      }

      logger.info('Product created:', {
        productId: product.id,
        sku: product.sku,
        createdBy: userId,
      });

      res.status(201).json(
        ApiResponse.success('Product created successfully', product)
      );
    } catch (error) {
      logger.error('Error creating product:', error);
      next(error);
    }
  }

  /**
   * Update product
   */
  async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user!.id;

      // Check if product exists
      const existingProduct = await prisma.product.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingProduct) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      // Convert decimal fields
      const processedData: any = { ...updateData };
      if (updateData.costPrice) processedData.costPrice = new Decimal(updateData.costPrice);
      if (updateData.wholesalePrice) processedData.wholesalePrice = new Decimal(updateData.wholesalePrice);
      if (updateData.retailPrice) processedData.retailPrice = new Decimal(updateData.retailPrice);
      if (updateData.minPrice) processedData.minPrice = new Decimal(updateData.minPrice);
      if (updateData.weight) processedData.weight = new Decimal(updateData.weight);
      if (updateData.consignmentRate) processedData.consignmentRate = new Decimal(updateData.consignmentRate);

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...processedData,
          updatedById: userId,
        },
        include: {
          category: true,
          supplier: true,
          updatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      logger.info('Product updated:', {
        productId: id,
        updatedBy: userId,
      });

      res.json(
        ApiResponse.success('Product updated successfully', product)
      );
    } catch (error) {
      logger.error('Error updating product:', error);
      next(error);
    }
  }

  /**
   * Soft delete product
   */
  async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      // Check if product has pending sales
      const pendingSales = await prisma.saleItem.count({
        where: {
          productId: id,
          sale: {
            status: 'DRAFT',
          },
        },
      });

      if (pendingSales > 0) {
        return res.status(400).json(
          ApiResponse.error('Cannot delete product with pending sales')
        );
      }

      await prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedById: userId,
        },
      });

      logger.info('Product deleted:', {
        productId: id,
        deletedBy: userId,
      });

      res.json(
        ApiResponse.success('Product deleted successfully')
      );
    } catch (error) {
      logger.error('Error deleting product:', error);
      next(error);
    }
  }

  /**
   * Restore soft-deleted product
   */
  async restoreProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      if (!product.deletedAt) {
        return res.status(400).json(
          ApiResponse.error('Product is not deleted')
        );
      }

      const restoredProduct = await prisma.product.update({
        where: { id },
        data: {
          deletedAt: null,
          updatedById: userId,
        },
        include: {
          category: true,
          supplier: true,
        },
      });

      logger.info('Product restored:', {
        productId: id,
        restoredBy: userId,
      });

      res.json(
        ApiResponse.success('Product restored successfully', restoredProduct)
      );
    } catch (error) {
      logger.error('Error restoring product:', error);
      next(error);
    }
  }

  /**
   * Get product variations
   */
  async getProductVariations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      const variations = await prisma.productVariation.findMany({
        where: { productId: id },
        orderBy: { name: 'asc' },
      });

      res.json(
        ApiResponse.success('Product variations retrieved successfully', variations)
      );
    } catch (error) {
      logger.error('Error getting product variations:', error);
      next(error);
    }
  }

  /**
   * Create product variation
   */
  async createProductVariation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const variationData = req.body;
      const userId = req.user!.id;

      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      const variation = await prisma.productVariation.create({
        data: {
          ...variationData,
          productId: id,
          priceAdjustment: variationData.priceAdjustment ? new Decimal(variationData.priceAdjustment) : null,
          createdBy: userId,
        },
      });

      logger.info('Product variation created:', {
        productId: id,
        variationId: variation.id,
        createdBy: userId,
      });

      res.status(201).json(
        ApiResponse.success('Product variation created successfully', variation)
      );
    } catch (error) {
      logger.error('Error creating product variation:', error);
      next(error);
    }
  }

  /**
   * Update product variation
   */
  async updateProductVariation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId, variationId } = req.params;
      const updateData = req.body;

      const variation = await prisma.productVariation.findFirst({
        where: { id: variationId, productId },
      });

      if (!variation) {
        return res.status(404).json(
          ApiResponse.error('Product variation not found')
        );
      }

      const processedData: any = { ...updateData };
      if (updateData.priceAdjustment) {
        processedData.priceAdjustment = new Decimal(updateData.priceAdjustment);
      }

      const updatedVariation = await prisma.productVariation.update({
        where: { id: variationId },
        data: processedData,
      });

      res.json(
        ApiResponse.success('Product variation updated successfully', updatedVariation)
      );
    } catch (error) {
      logger.error('Error updating product variation:', error);
      next(error);
    }
  }

  /**
   * Delete product variation
   */
  async deleteProductVariation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId, variationId } = req.params;

      const variation = await prisma.productVariation.findFirst({
        where: { id: variationId, productId },
      });

      if (!variation) {
        return res.status(404).json(
          ApiResponse.error('Product variation not found')
        );
      }

      await prisma.productVariation.update({
        where: { id: variationId },
        data: { isActive: false },
      });

      res.json(
        ApiResponse.success('Product variation deleted successfully')
      );
    } catch (error) {
      logger.error('Error deleting product variation:', error);
      next(error);
    }
  }

  /**
   * Update stock
   */
  async updateStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity, reason, type = 'ADJUSTMENT' } = req.body;
      const userId = req.user!.id;

      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      const newStock = Math.max(0, product.stockQuantity + quantity);
      const movementType = quantity > 0 ? 'STOCK_IN' : 'STOCK_OUT';

      // Update product stock
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          stockQuantity: newStock,
          updatedById: userId,
        },
      });

      // Log inventory movement
      await prisma.inventoryMovement.create({
        data: {
          productId: id,
          type: movementType,
          quantity: Math.abs(quantity),
          stockBefore: product.stockQuantity,
          stockAfter: newStock,
          referenceType: type,
          reason: reason || `Stock ${movementType.toLowerCase()}`,
          createdBy: userId,
        },
      });

      logger.info('Stock updated:', {
        productId: id,
        oldStock: product.stockQuantity,
        newStock,
        quantity,
        updatedBy: userId,
      });

      res.json(
        ApiResponse.success('Stock updated successfully', {
          product: updatedProduct,
          oldStock: product.stockQuantity,
          newStock,
        })
      );
    } catch (error) {
      logger.error('Error updating stock:', error);
      next(error);
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { limit = 50 } = req.query as any;

      const products = await prisma.$queryRaw`
        SELECT p.*, c.name as "categoryName", s.name as "supplierName"
        FROM "Product" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        LEFT JOIN "Supplier" s ON p."supplierId" = s.id
        WHERE p."deletedAt" IS NULL 
        AND p."stockQuantity" <= p."minStockLevel"
        ORDER BY (p."stockQuantity"::float / NULLIF(p."minStockLevel", 0)) ASC
        LIMIT ${limit}
      `;

      res.json(
        ApiResponse.success('Low stock products retrieved successfully', products)
      );
    } catch (error) {
      logger.error('Error getting low stock products:', error);
      next(error);
    }
  }

  /**
   * Restock product
   */
  async restockProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity, unitCost, supplierInvoice, notes } = req.body;
      const userId = req.user!.id;

      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      const newStock = product.stockQuantity + quantity;
      const totalCost = new Decimal(unitCost || product.costPrice).mul(quantity);

      // Update product stock
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          stockQuantity: newStock,
          updatedById: userId,
        },
      });

      // Log inventory movement
      await prisma.inventoryMovement.create({
        data: {
          productId: id,
          type: 'STOCK_IN',
          quantity,
          unitPrice: new Decimal(unitCost || product.costPrice),
          totalValue: totalCost,
          stockBefore: product.stockQuantity,
          stockAfter: newStock,
          referenceType: 'PURCHASE',
          reason: notes || 'Restock',
          createdBy: userId,
        },
      });

      logger.info('Product restocked:', {
        productId: id,
        quantity,
        totalCost: totalCost.toNumber(),
        restockedBy: userId,
      });

      res.json(
        ApiResponse.success('Product restocked successfully', {
          product: updatedProduct,
          quantityAdded: quantity,
          newStock,
        })
      );
    } catch (error) {
      logger.error('Error restocking product:', error);
      next(error);
    }
  }

  /**
   * Get stock history
   */
  async getStockHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query as any;

      const { page: validPage, limit: validLimit } = validatePagination(page, limit);
      const offset = (validPage - 1) * validLimit;

      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      const [movements, total] = await Promise.all([
        prisma.inventoryMovement.findMany({
          where: { productId: id },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: validLimit,
        }),
        prisma.inventoryMovement.count({
          where: { productId: id },
        }),
      ]);

      res.json(
        ApiResponse.paginated(
          'Stock history retrieved successfully',
          movements,
          validPage,
          validLimit,
          total
        )
      );
    } catch (error) {
      logger.error('Error getting stock history:', error);
      next(error);
    }
  }

  /**
   * Upload product images
   */
  async uploadProductImages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { images } = req.body; // Array of image URLs

      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
      });

      if (!product) {
        return res.status(404).json(
          ApiResponse.error('Product not found')
        );
      }

      // Create image records
      const imageRecords = await Promise.all(
        images.map((imageUrl: string, index: number) =>
          prisma.productImage.create({
            data: {
              productId: id,
              url: imageUrl,
              altText: `${product.name} image ${index + 1}`,
              sortOrder: index,
            },
          })
        )
      );

      res.json(
        ApiResponse.success('Product images uploaded successfully', imageRecords)
      );
    } catch (error) {
      logger.error('Error uploading product images:', error);
      next(error);
    }
  }

  /**
   * Delete product image
   */
  async deleteProductImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId, imageId } = req.params;

      const image = await prisma.productImage.findFirst({
        where: { id: imageId, productId },
      });

      if (!image) {
        return res.status(404).json(
          ApiResponse.error('Product image not found')
        );
      }

      await prisma.productImage.delete({
        where: { id: imageId },
      });

      res.json(
        ApiResponse.success('Product image deleted successfully')
      );
    } catch (error) {
      logger.error('Error deleting product image:', error);
      next(error);
    }
  }
}
