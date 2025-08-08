import { PrismaClient, MovementType, Prisma } from '@prisma/client'
import { redisService } from './RedisService'
import { s3Service } from './S3Service'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface CreateProductData {
  name: string
  description?: string
  categoryId: string  // Changed to match schema
  brand?: string
  model?: string
  sku: string
  barcode?: string
  basePriceRwf: number  // Using schema field names
  minPriceRwf: number
  maxDiscountPercent?: number
  wholesalePriceRwf?: number
  basePriceUsd?: number
  minPriceUsd?: number
  wholesalePriceUsd?: number
  basePriceEur?: number
  minPriceEur?: number
  wholesalePriceEur?: number
  stockQuantity: number
  minStockLevel?: number  // Using schema field names
  maxStockLevel?: number
  reorderPoint?: number
  supplierIds?: string[]  // Array for many-to-many relation
  images?: string[]
  specifications?: Record<string, any>
  compatibility?: Record<string, any>
  variations?: Record<string, any>
}

interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}

interface ProductQuery {
  categoryId?: string  // Changed to match schema
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  lowStock?: boolean
  featured?: boolean
  supplierIds?: string[]  // Changed to array
  limit?: number
  offset?: number
  sortBy?: 'name' | 'basePriceRwf' | 'stockQuantity' | 'createdAt'  // Using schema field names
  sortOrder?: 'asc' | 'desc'
}

export class ProductService {
  private static instance: ProductService
  private readonly CACHE_TTL = 3600 // 1 hour

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService()
    }
    return ProductService.instance
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductData, userId: string): Promise<any> {
    try {
      // Check if SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: data.sku }
      })

      if (existingProduct) {
        throw new Error(`Product with SKU ${data.sku} already exists`)
      }

      // Create product with transaction to handle supplier relations
      const product = await prisma.$transaction(async (tx) => {
        // Create the product
        const newProduct = await tx.product.create({
          data: {
            name: data.name,
            description: data.description || null,
            category: {
              connect: { id: data.categoryId }
            },
            brand: data.brand || null,
            model: data.model || null,
            sku: data.sku,
            barcode: data.barcode || null,
            basePriceRwf: data.basePriceRwf,
            minPriceRwf: data.minPriceRwf,
            maxDiscountPercent: data.maxDiscountPercent || 0,
            wholesalePriceRwf: data.wholesalePriceRwf || null,
            basePriceUsd: data.basePriceUsd || null,
            minPriceUsd: data.minPriceUsd || null,
            wholesalePriceUsd: data.wholesalePriceUsd || null,
            basePriceEur: data.basePriceEur || null,
            minPriceEur: data.minPriceEur || null,
            wholesalePriceEur: data.wholesalePriceEur || null,
            stockQuantity: data.stockQuantity,
            minStockLevel: data.minStockLevel || 5,
            maxStockLevel: data.maxStockLevel || null,
            reorderPoint: data.reorderPoint || 10,
            images: data.images || [],
            specifications: data.specifications || Prisma.JsonNull,
            isActive: true
          }
        })

        // Create supplier relationships if provided
        if (data.supplierIds && data.supplierIds.length > 0) {
          for (const supplierId of data.supplierIds) {
            await tx.productSupplier.create({
              data: {
                productId: newProduct.id,
                supplierId: supplierId
              }
            })
          }
        }

        // Create initial stock movement
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            userId: userId,
            type: 'RESTOCK' as MovementType,
            quantity: data.stockQuantity,
            stockBefore: 0,
            stockAfter: data.stockQuantity,
            reason: 'Initial stock'
          }
        })

        return newProduct
      })

      // Fetch the complete product with relations
      const completeProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          suppliers: {
            include: {
              supplier: true
            }
          }
        }
      })

      // Invalidate cache
      await this.invalidateProductCache()

      logger.info(`Product created: ${completeProduct?.name} (${completeProduct?.sku})`)
      return completeProduct

    } catch (error) {
      logger.error('Error creating product:', error)
      throw error
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string, useCache: boolean = true): Promise<any> {
    try {
      const cacheKey = `product:${id}`

      if (useCache) {
        const cached = await redisService.getJSON(cacheKey)
        if (cached) return cached
      }

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          suppliers: {
            include: {
              supplier: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          stockMovements: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              quantity: true,
              reason: true,
              createdAt: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          _count: {
            select: {
              saleItems: {
                where: {
                  sale: {
                    status: 'COMPLETED'
                  }
                }
              }
            }
          }
        }
      })

      if (!product) {
        throw new Error('Product not found')
      }

      // Cache the result
      if (useCache) {
        await redisService.setJSON(cacheKey, product, this.CACHE_TTL)
      }

      return product

    } catch (error) {
      logger.error('Error getting product:', error)
      throw error
    }
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(query: ProductQuery): Promise<{
    products: any[]
    total: number
    hasMore: boolean
  }> {
    try {
      const {
        categoryId,
        search,
        minPrice,
        maxPrice,
        inStock,
        lowStock,
        supplierIds,
        limit = 20,
        offset = 0,
        sortBy = 'name',
        sortOrder = 'asc'
      } = query

      // Build cache key
      const cacheKey = `products:${JSON.stringify(query)}`
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      // Build where clause
      const where: any = {
        isActive: true
      }

      if (categoryId) {
        where.categoryId = categoryId
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (minPrice || maxPrice) {
        where.basePriceRwf = {}
        if (minPrice) where.basePriceRwf.gte = minPrice
        if (maxPrice) where.basePriceRwf.lte = maxPrice
      }

      if (inStock) {
        where.stockQuantity = { gt: 0 }
      }

      if (lowStock) {
        where.AND = [
          { stockQuantity: { lte: where.minStockLevel || 5 } },
          { stockQuantity: { gt: 0 } }
        ]
      }

      if (supplierIds && supplierIds.length > 0) {
        where.suppliers = {
          some: {
            supplierId: {
              in: supplierIds
            }
          }
        }
      }

      // Build order clause
      const orderBy: any = {}
      switch (sortBy) {
        case 'basePriceRwf':
          orderBy.basePriceRwf = sortOrder
          break
        case 'stockQuantity':
          orderBy.stockQuantity = sortOrder
          break
        case 'createdAt':
          orderBy.createdAt = sortOrder
          break
        default:
          orderBy.name = sortOrder
      }

      // Get products and total count
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            },
            suppliers: {
              include: {
                supplier: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy,
          take: limit,
          skip: offset
        }),
        prisma.product.count({ where })
      ])

      const result = {
        products,
        total,
        hasMore: offset + products.length < total
      }

      // Cache for 5 minutes
      await redisService.setJSON(cacheKey, result, 300)

      return result

    } catch (error) {
      logger.error('Error getting products:', error)
      throw error
    }
  }

  /**
   * Update product
   */
  async updateProduct(data: UpdateProductData): Promise<any> {
    try {
      const { id, ...updateData } = data

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      })

      if (!existingProduct) {
        throw new Error('Product not found')
      }

      // Check SKU uniqueness if being updated
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const skuExists = await prisma.product.findUnique({
          where: { sku: updateData.sku }
        })

        if (skuExists) {
          throw new Error(`Product with SKU ${updateData.sku} already exists`)
        }
      }

      // Update product
      const updateFields: any = {}
      
      // Only include defined fields
      if (updateData.name !== undefined) updateFields.name = updateData.name
      if (updateData.description !== undefined) updateFields.description = updateData.description
      if (updateData.brand !== undefined) updateFields.brand = updateData.brand
      if (updateData.model !== undefined) updateFields.model = updateData.model
      if (updateData.sku !== undefined) updateFields.sku = updateData.sku
      if (updateData.barcode !== undefined) updateFields.barcode = updateData.barcode
      if (updateData.basePriceRwf !== undefined) updateFields.basePriceRwf = updateData.basePriceRwf
      if (updateData.minPriceRwf !== undefined) updateFields.minPriceRwf = updateData.minPriceRwf
      if (updateData.maxDiscountPercent !== undefined) updateFields.maxDiscountPercent = updateData.maxDiscountPercent
      if (updateData.wholesalePriceRwf !== undefined) updateFields.wholesalePriceRwf = updateData.wholesalePriceRwf
      if (updateData.basePriceUsd !== undefined) updateFields.basePriceUsd = updateData.basePriceUsd
      if (updateData.minPriceUsd !== undefined) updateFields.minPriceUsd = updateData.minPriceUsd
      if (updateData.wholesalePriceUsd !== undefined) updateFields.wholesalePriceUsd = updateData.wholesalePriceUsd
      if (updateData.basePriceEur !== undefined) updateFields.basePriceEur = updateData.basePriceEur
      if (updateData.minPriceEur !== undefined) updateFields.minPriceEur = updateData.minPriceEur
      if (updateData.wholesalePriceEur !== undefined) updateFields.wholesalePriceEur = updateData.wholesalePriceEur
      if (updateData.stockQuantity !== undefined) updateFields.stockQuantity = updateData.stockQuantity
      if (updateData.minStockLevel !== undefined) updateFields.minStockLevel = updateData.minStockLevel
      if (updateData.maxStockLevel !== undefined) updateFields.maxStockLevel = updateData.maxStockLevel
      if (updateData.reorderPoint !== undefined) updateFields.reorderPoint = updateData.reorderPoint
      if (updateData.images !== undefined) updateFields.images = updateData.images
      if (updateData.specifications !== undefined) updateFields.specifications = updateData.specifications

      // Handle category relation
      if (updateData.categoryId) {
        updateFields.category = {
          connect: { id: updateData.categoryId }
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateFields,
        include: {
          category: true,
          suppliers: {
            include: {
              supplier: true
            }
          }
        }
      })

      // Invalidate cache
      await this.invalidateProductCache(id)

      logger.info(`Product updated: ${product.name} (${product.sku})`)
      return product

    } catch (error) {
      logger.error('Error updating product:', error)
      throw error
    }
  }

  /**
   * Update stock quantity
   */
  async updateStock(
    productId: string,
    newQuantity: number,
    reason: string,
    userId: string,
    referenceId?: string
  ): Promise<any> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get current product
        const product = await tx.product.findUnique({
          where: { id: productId }
        })

        if (!product) {
          throw new Error('Product not found')
        }

        const previousQuantity = product.stockQuantity
        const quantityDifference = newQuantity - previousQuantity

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: newQuantity
          }
        })

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            productId,
            userId,
            type: quantityDifference > 0 ? 'RESTOCK' : 'ADJUSTMENT',
            quantity: Math.abs(quantityDifference),
            stockBefore: previousQuantity,
            stockAfter: newQuantity,
            reason,
            reference: referenceId || null
          }
        })

        // Check if we need to log low stock (optional - could be handled elsewhere)
        if (newQuantity <= (product.minStockLevel || 0) && newQuantity > 0) {
          logger.warn(`Low stock alert for product ${product.name}: ${newQuantity} remaining`)
        } else if (newQuantity === 0) {
          logger.warn(`Out of stock alert for product ${product.name}`)
        }

        // Invalidate cache
        await this.invalidateProductCache(productId)

        return updatedProduct
      })

    } catch (error) {
      logger.error('Error updating stock:', error)
      throw error
    }
  }

  /**
   * Upload product images
   */
  async uploadProductImages(
    productId: string,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>
  ): Promise<string[]> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) {
        throw new Error('Product not found')
      }

      // Upload images to S3
      const uploadPromises = files.map(file =>
        s3Service.uploadFile(file.buffer, file.originalname, {
          folder: `products/${productId}`,
          contentType: file.mimetype,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
        })
      )

      const uploadResults = await Promise.all(uploadPromises)
      const imageUrls = uploadResults.map(result => result.url)

      // Update product with new images
      const updatedImages = [...(product.images || []), ...imageUrls]

      await prisma.product.update({
        where: { id: productId },
        data: {
          images: updatedImages
        }
      })

      // Invalidate cache
      await this.invalidateProductCache(productId)

      return imageUrls

    } catch (error) {
      logger.error('Error uploading product images:', error)
      throw error
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<any[]> {
    try {
      const cacheKey = 'products:low_stock'
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: {
            lte: 5 // We'll need to make this dynamic or configurable
          }
        },
        include: {
          category: {
            select: {
              name: true
            }
          },
          suppliers: {
            include: {
              supplier: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          stockQuantity: 'asc'
        }
      })

      // Cache for 5 minutes
      await redisService.setJSON(cacheKey, products, 300)

      return products

    } catch (error) {
      logger.error('Error getting low stock products:', error)
      throw error
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      // Check if product has any sales
      const salesCount = await prisma.saleItem.count({
        where: { productId: id }
      })

      if (salesCount > 0) {
        // Soft delete - just deactivate
        await prisma.product.update({
          where: { id },
          data: {
            isActive: false
          }
        })
      } else {
        // Hard delete if no sales history
        await prisma.product.delete({
          where: { id }
        })
      }

      // Invalidate cache
      await this.invalidateProductCache(id)

      return true

    } catch (error) {
      logger.error('Error deleting product:', error)
      throw error
    }
  }

  /**
   * Get product categories with counts
   */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    try {
      const cacheKey = 'product:categories'
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      // Get categories from the Category table with product counts
      const categories = await prisma.category.findMany({
        where: {
          isActive: true
        },
        include: {
          _count: {
            select: {
              products: {
                where: {
                  isActive: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      const result = categories.map(cat => ({
        category: cat.name,
        count: cat._count.products
      }))

      // Cache for 1 hour
      await redisService.setJSON(cacheKey, result, 3600)

      return result

    } catch (error) {
      logger.error('Error getting categories:', error)
      throw error
    }
  }

  /**
   * Search products (with enhanced search)
   */
  async searchProducts(searchTerm: string, limit: number = 10): Promise<any[]> {
    try {
      const cacheKey = `search:${searchTerm}:${limit}`
      const cached = await redisService.getJSON(cacheKey)
      if (cached) return cached

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { brand: { contains: searchTerm, mode: 'insensitive' } },
            { model: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
            { barcode: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          category: {
            select: {
              name: true
            }
          },
          suppliers: {
            include: {
              supplier: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ],
        take: limit
      })

      // Cache for 10 minutes
      await redisService.setJSON(cacheKey, products, 600)

      return products

    } catch (error) {
      logger.error('Error searching products:', error)
      throw error
    }
  }

  /**
   * Invalidate product cache
   */
  private async invalidateProductCache(productId?: string): Promise<void> {
    try {
      const patterns = [
        'products:*',
        'product:categories',
        'products:low_stock',
        'search:*'
      ]

      if (productId) {
        patterns.push(`product:${productId}`)
      }

      await Promise.all(
        patterns.map(pattern => redisService.invalidatePattern(pattern))
      )

    } catch (error) {
      logger.error('Error invalidating product cache:', error)
    }
  }
}

export const productService = ProductService.getInstance()
