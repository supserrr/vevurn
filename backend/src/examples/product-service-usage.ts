import { ProductService } from '../services/ProductService'

// Example usage of ProductService
async function productServiceExamples() {
  const productService = ProductService.getInstance()

  try {
    // Example 1: Create a new product
    const newProduct = await productService.createProduct({
      name: "Samsung Galaxy S24",
      description: "Latest Samsung flagship smartphone",
      categoryId: "category-id-123", // Must exist in categories table
      brand: "Samsung",
      model: "Galaxy S24",
      sku: "SAMS24-001",
      barcode: "8801234567890",
      basePriceRwf: 850000,
      minPriceRwf: 800000,
      maxDiscountPercent: 10,
      wholesalePriceRwf: 750000,
      basePriceUsd: 850,
      minPriceUsd: 800,
      stockQuantity: 50,
      minStockLevel: 5,
      reorderPoint: 10,
      supplierIds: ["supplier-id-1", "supplier-id-2"], // Must exist in suppliers table
      images: ["https://example.com/image1.jpg"],
      specifications: {
        color: "Black",
        storage: "256GB",
        ram: "8GB",
        display: "6.2 inches"
      }
    }, "user-id-123")

    console.log('Created product:', newProduct.name)

    // Example 2: Get products with filtering
    const products = await productService.getProducts({
      categoryId: "category-id-123",
      search: "Samsung",
      minPrice: 500000,
      maxPrice: 1000000,
      inStock: true,
      limit: 10,
      sortBy: 'name',
      sortOrder: 'asc'
    })

    console.log(`Found ${products.total} products`)

    // Example 3: Update stock
    await productService.updateStock(
      newProduct.id,
      45, // New quantity
      "Sold 5 units",
      "user-id-123",
      "sale-ref-123"
    )

    // Example 4: Upload product images
    // Note: In real usage, you'd get file buffers from multer or similar
    const mockFiles = [
      {
        buffer: Buffer.from('mock-image-data'),
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg'
      }
    ]
    const imageUrls = await productService.uploadProductImages(
      newProduct.id,
      mockFiles
    )

    console.log('Uploaded images:', imageUrls)

    // Example 5: Get low stock products
    const lowStockProducts = await productService.getLowStockProducts()
    console.log(`${lowStockProducts.length} products are running low on stock`)

    // Example 6: Search products
    const searchResults = await productService.searchProducts("Samsung Galaxy", 20)
    console.log(`Search found ${searchResults.length} products`)

    // Example 7: Get product by ID
    const singleProduct = await productService.getProductById(newProduct.id)
    console.log('Product details:', singleProduct?.name)

    // Example 8: Update product
    await productService.updateProduct({
      id: newProduct.id,
      basePriceRwf: 825000, // Update price
      stockQuantity: 40 // Update stock
    })

    // Example 9: Get categories with product counts
    const categories = await productService.getCategories()
    console.log('Categories:', categories)

  } catch (error) {
    console.error('Product service error:', error)
  }
}

// Export the example function
export { productServiceExamples }

// Example of typical Express.js route usage
export const productRouteExamples = {
  // CREATE: POST /api/products
  createProduct: async (req: any, res: any) => {
    try {
      const productService = ProductService.getInstance()
      const product = await productService.createProduct(req.body, req.user.id)
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  // READ: GET /api/products
  getProducts: async (req: any, res: any) => {
    try {
      const productService = ProductService.getInstance()
      const result = await productService.getProducts(req.query)
      res.json({
        success: true,
        data: result.products,
        total: result.total,
        hasMore: result.hasMore
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  },

  // UPDATE: PUT /api/products/:id/stock
  updateStock: async (req: any, res: any) => {
    try {
      const productService = ProductService.getInstance()
      const { quantity, reason } = req.body
      const result = await productService.updateStock(
        req.params.id,
        quantity,
        reason || 'Manual adjustment',
        req.user.id,
        req.body.referenceId
      )
      res.json({
        success: true,
        data: result,
        message: 'Stock updated successfully'
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  // DELETE: DELETE /api/products/:id
  deleteProduct: async (req: any, res: any) => {
    try {
      const productService = ProductService.getInstance()
      await productService.deleteProduct(req.params.id)
      res.json({
        success: true,
        message: 'Product deleted successfully'
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }
}
