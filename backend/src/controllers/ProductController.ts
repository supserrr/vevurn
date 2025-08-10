import { Request, Response, NextFunction } from 'express'
import { ProductService } from '../services/ProductService'
import { z } from 'zod'

// Add this interface for multer file uploads
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// Get the singleton instance
const productService = ProductService.getInstance()

// Validation schemas aligned with updated ProductService
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category ID is required'), // Updated to match schema
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  basePriceRwf: z.number().min(0, 'Base price must be positive'), // Updated field names
  minPriceRwf: z.number().min(0, 'Min price must be positive'),
  maxDiscountPercent: z.number().min(0).max(100).optional(),
  wholesalePriceRwf: z.number().min(0).optional(),
  basePriceUsd: z.number().min(0).optional(),
  minPriceUsd: z.number().min(0).optional(),
  wholesalePriceUsd: z.number().min(0).optional(),
  basePriceEur: z.number().min(0).optional(),
  minPriceEur: z.number().min(0).optional(),
  wholesalePriceEur: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  minStockLevel: z.number().int().min(0).optional(), // Updated field names
  maxStockLevel: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  supplierIds: z.array(z.string().uuid()).optional(), // Updated to array for many-to-many
  images: z.array(z.string().url()).optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  compatibility: z.record(z.string(), z.any()).optional(),
  variations: z.record(z.string(), z.any()).optional()
})

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid()
})

const productQuerySchema = z.object({
  categoryId: z.string().optional(), // Updated to match schema
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
  supplierIds: z.array(z.string().uuid()).optional(), // Updated to array
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'basePriceRwf', 'stockQuantity', 'createdAt']).default('name'), // Updated field names
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export class ProductController {
  /**
   * Create a new product
   */
  static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createProductSchema.parse(req.body)
      const userId = (req as any).user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      // Transform data to match ProductService interface, removing undefined values
      const productData: any = {
        name: validatedData.name,
        categoryId: validatedData.categoryId,
        sku: validatedData.sku,
        basePriceRwf: validatedData.basePriceRwf,
        minPriceRwf: validatedData.minPriceRwf,
        stockQuantity: validatedData.stockQuantity
      }
      
      // Add optional fields only if they're defined
      if (validatedData.description !== undefined) productData.description = validatedData.description
      if (validatedData.brand !== undefined) productData.brand = validatedData.brand
      if (validatedData.model !== undefined) productData.model = validatedData.model
      if (validatedData.barcode !== undefined) productData.barcode = validatedData.barcode
      if (validatedData.maxDiscountPercent !== undefined) productData.maxDiscountPercent = validatedData.maxDiscountPercent
      if (validatedData.wholesalePriceRwf !== undefined) productData.wholesalePriceRwf = validatedData.wholesalePriceRwf
      if (validatedData.basePriceUsd !== undefined) productData.basePriceUsd = validatedData.basePriceUsd
      if (validatedData.minPriceUsd !== undefined) productData.minPriceUsd = validatedData.minPriceUsd
      if (validatedData.wholesalePriceUsd !== undefined) productData.wholesalePriceUsd = validatedData.wholesalePriceUsd
      if (validatedData.basePriceEur !== undefined) productData.basePriceEur = validatedData.basePriceEur
      if (validatedData.minPriceEur !== undefined) productData.minPriceEur = validatedData.minPriceEur
      if (validatedData.wholesalePriceEur !== undefined) productData.wholesalePriceEur = validatedData.wholesalePriceEur
      if (validatedData.minStockLevel !== undefined) productData.minStockLevel = validatedData.minStockLevel
      if (validatedData.maxStockLevel !== undefined) productData.maxStockLevel = validatedData.maxStockLevel
      if (validatedData.reorderPoint !== undefined) productData.reorderPoint = validatedData.reorderPoint
      if (validatedData.supplierIds !== undefined) productData.supplierIds = validatedData.supplierIds
      if (validatedData.images !== undefined) productData.images = validatedData.images
      if (validatedData.specifications !== undefined) productData.specifications = validatedData.specifications
      if (validatedData.compatibility !== undefined) productData.compatibility = validatedData.compatibility
      if (validatedData.variations !== undefined) productData.variations = validatedData.variations

      const product = await productService.createProduct(productData, userId)

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Get all products with filtering and pagination
   */
  static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = productQuerySchema.parse(req.query)
      
      // Build clean query object without undefined values
      const serviceQuery: any = {
        limit: query.limit,
        offset: query.offset,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      }
      
      if (query.categoryId) serviceQuery.categoryId = query.categoryId
      if (query.search) serviceQuery.search = query.search
      if (query.minPrice !== undefined) serviceQuery.minPrice = query.minPrice
      if (query.maxPrice !== undefined) serviceQuery.maxPrice = query.maxPrice
      if (query.inStock !== undefined) serviceQuery.inStock = query.inStock
      if (query.lowStock !== undefined) serviceQuery.lowStock = query.lowStock
      if (query.supplierIds) serviceQuery.supplierIds = query.supplierIds
      
      const result = await productService.getProducts(serviceQuery)

      res.json({
        success: true,
        data: result.products,
        pagination: {
          total: result.total,
          limit: query.limit,
          offset: query.offset,
          hasMore: result.hasMore
        }
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.issues
        })
        return
      }
      next(error)
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required'
        })
        return
      }

      const product = await productService.getProductById(id)

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        })
        return
      }

      res.json({
        success: true,
        data: product
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Update product
   */
  static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const updateData = { ...req.body, id }
      const validatedData = updateProductSchema.parse(updateData)

      // Build clean update object without undefined values
      const serviceData: any = { id: validatedData.id }
      
      if (validatedData.name !== undefined) serviceData.name = validatedData.name
      if (validatedData.description !== undefined) serviceData.description = validatedData.description
      if (validatedData.categoryId !== undefined) serviceData.categoryId = validatedData.categoryId
      if (validatedData.brand !== undefined) serviceData.brand = validatedData.brand
      if (validatedData.model !== undefined) serviceData.model = validatedData.model
      if (validatedData.sku !== undefined) serviceData.sku = validatedData.sku
      if (validatedData.barcode !== undefined) serviceData.barcode = validatedData.barcode
      if (validatedData.basePriceRwf !== undefined) serviceData.basePriceRwf = validatedData.basePriceRwf
      if (validatedData.minPriceRwf !== undefined) serviceData.minPriceRwf = validatedData.minPriceRwf
      if (validatedData.maxDiscountPercent !== undefined) serviceData.maxDiscountPercent = validatedData.maxDiscountPercent
      if (validatedData.wholesalePriceRwf !== undefined) serviceData.wholesalePriceRwf = validatedData.wholesalePriceRwf
      if (validatedData.basePriceUsd !== undefined) serviceData.basePriceUsd = validatedData.basePriceUsd
      if (validatedData.minPriceUsd !== undefined) serviceData.minPriceUsd = validatedData.minPriceUsd
      if (validatedData.wholesalePriceUsd !== undefined) serviceData.wholesalePriceUsd = validatedData.wholesalePriceUsd
      if (validatedData.basePriceEur !== undefined) serviceData.basePriceEur = validatedData.basePriceEur
      if (validatedData.minPriceEur !== undefined) serviceData.minPriceEur = validatedData.minPriceEur
      if (validatedData.wholesalePriceEur !== undefined) serviceData.wholesalePriceEur = validatedData.wholesalePriceEur
      if (validatedData.stockQuantity !== undefined) serviceData.stockQuantity = validatedData.stockQuantity
      if (validatedData.minStockLevel !== undefined) serviceData.minStockLevel = validatedData.minStockLevel
      if (validatedData.maxStockLevel !== undefined) serviceData.maxStockLevel = validatedData.maxStockLevel
      if (validatedData.reorderPoint !== undefined) serviceData.reorderPoint = validatedData.reorderPoint
      if (validatedData.supplierIds !== undefined) serviceData.supplierIds = validatedData.supplierIds
      if (validatedData.images !== undefined) serviceData.images = validatedData.images
      if (validatedData.specifications !== undefined) serviceData.specifications = validatedData.specifications
      if (validatedData.compatibility !== undefined) serviceData.compatibility = validatedData.compatibility
      if (validatedData.variations !== undefined) serviceData.variations = validatedData.variations

      const product = await productService.updateProduct(serviceData)

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues
        })
        return
      }
      
      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        })
        return
      }

      next(error)
    }
  }

  /**
   * Update product stock
   */
  static async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const { quantity, reason, referenceId } = req.body
      const userId = (req as any).user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
        return
      }

      if (typeof quantity !== 'number' || quantity < 0) {
        res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        })
        return
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Reason is required'
        })
        return
      }

      const product = await productService.updateStock(
        id,
        quantity,
        reason,
        userId,
        referenceId
      )

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: product
      })

    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        })
        return
      }
      next(error)
    }
  }

  /**
   * Upload product images
   */
  static async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const files = req.files as UploadedFile[]

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded'
        })
        return
      }

      // Convert multer files to the format expected by ProductService
      const fileData = files.map(file => ({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype
      }))

      const imageUrls = await productService.uploadProductImages(id, fileData)

      res.json({
        success: true,
        message: 'Images uploaded successfully',
        data: { imageUrls }
      })

    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        })
        return
      }
      next(error)
    }
  }

  /**
   * Search products
   */
  static async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, limit } = req.query
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        })
        return
      }

      const searchLimit = limit ? parseInt(limit as string, 10) : 10

      const products = await productService.searchProducts(q, searchLimit)

      res.json({
        success: true,
        data: products
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await productService.getLowStockProducts()

      res.json({
        success: true,
        data: products
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Get product categories
   */
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await productService.getCategories()

      res.json({
        success: true,
        data: categories
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params

      const success = await productService.deleteProduct(id)

      if (success) {
        res.json({
          success: true,
          message: 'Product deleted successfully'
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete product'
        })
      }

    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        })
        return
      }
      next(error)
    }
  }

  /**
   * Bulk update products
   */
  static async bulkUpdateProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { updates } = req.body

      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Updates array is required'
        })
        return
      }

      const results = []
      const errors = []

      for (const update of updates) {
        try {
          const validatedData = updateProductSchema.parse(update)
          
          // Build clean update object
          const serviceData: any = { id: validatedData.id }
          Object.keys(validatedData).forEach(key => {
            if (key !== 'id' && validatedData[key as keyof typeof validatedData] !== undefined) {
              serviceData[key] = validatedData[key as keyof typeof validatedData]
            }
          })
          
          const product = await productService.updateProduct(serviceData)
          results.push({ id: update.id, success: true, data: product })
        } catch (error) {
          errors.push({ 
            id: update.id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      res.json({
        success: true,
        message: `Bulk update completed. ${results.length} successful, ${errors.length} failed`,
        data: {
          successful: results,
          failed: errors
        }
      })

    } catch (error) {
      next(error)
    }
  }

  /**
   * Export products to CSV
   */
  static async exportProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = productQuerySchema.parse(req.query)
      
      // Build export query without undefined values
      const exportQuery: any = {
        limit: 10000,
        offset: 0,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      }
      
      if (query.categoryId) exportQuery.categoryId = query.categoryId
      if (query.search) exportQuery.search = query.search
      if (query.minPrice !== undefined) exportQuery.minPrice = query.minPrice
      if (query.maxPrice !== undefined) exportQuery.maxPrice = query.maxPrice
      if (query.inStock !== undefined) exportQuery.inStock = query.inStock
      if (query.lowStock !== undefined) exportQuery.lowStock = query.lowStock
      if (query.supplierIds) exportQuery.supplierIds = query.supplierIds
      
      const result = await productService.getProducts(exportQuery)

      // Convert to CSV format - updated field names
      const csvHeader = 'ID,Name,SKU,Category,Brand,Model,Base Price RWF,Min Price RWF,Wholesale Price RWF,Stock,Status\n'
      const csvData = result.products.map(product => 
        `${product.id},"${product.name}","${product.sku}","${product.category?.name || ''}","${product.brand || ''}","${product.model || ''}",${product.basePriceRwf},${product.minPriceRwf},${product.wholesalePriceRwf || ''},${product.stockQuantity},${product.isActive ? 'Active' : 'Inactive'}`
      ).join('\n')

      const csv = csvHeader + csvData

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv')
      res.send(csv)

    } catch (error) {
      next(error)
    }
  }
}
