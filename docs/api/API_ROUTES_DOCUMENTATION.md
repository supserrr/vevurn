# API Routes and Controllers Documentation

This document provides comprehensive information about the API routing system and controllers for the Vevurn POS system.

## Overview

The API follows RESTful principles with organized routing structure, comprehensive controllers, and proper middleware integration.

## Routes Structure

```
src/routes/
├── index.ts           # Main routes aggregator
└── products.routes.ts # Product management endpoints
```

## Main Routes (src/routes/index.ts)

### Base Endpoints

#### GET /
- **Description**: API status and basic information
- **Response**: API version, status, and timestamp
- **Authentication**: None required

#### GET /health
- **Description**: Health check endpoint for monitoring
- **Response**: API health status and uptime
- **Authentication**: None required

#### GET /info
- **Description**: API information and description
- **Response**: API details and version information
- **Authentication**: None required

## Product Routes (src/routes/products.routes.ts)

### Product CRUD Operations

#### GET /products
- **Description**: List products with advanced filtering and pagination
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 20, max: 100)
  - `categoryId` (string): Filter by category
  - `supplierId` (string): Filter by supplier
  - `status` (enum): Filter by product status
  - `minPrice`, `maxPrice` (number): Price range filter
  - `inStock` (boolean): Only in-stock products
  - `lowStock` (boolean): Only low-stock products
  - `brand` (string): Filter by brand
  - `tags` (array): Filter by tags
  - `query` (string): Search in name, description, SKU, barcode
  - `sortBy` (string): Sort field (default: createdAt)
  - `sortOrder` (enum): asc/desc (default: desc)
- **Response**: Paginated product list with category, supplier, images, variations
- **Features**: Advanced search, filtering, sorting, pagination

#### GET /products/:id
- **Description**: Get detailed product information
- **Parameters**: `id` - Product ID
- **Response**: Complete product details with relationships
- **Includes**: Category, supplier, images, variations, audit trail

#### POST /products
- **Description**: Create new product
- **Body**: Product creation data (see Product Schema)
- **Features**: 
  - Auto-generate SKU and barcode if not provided
  - Initial stock logging
  - Audit trail creation
- **Response**: Created product with relationships

#### PUT /products/:id
- **Description**: Update existing product
- **Parameters**: `id` - Product ID
- **Body**: Product update data (partial)
- **Features**: 
  - Decimal price handling
  - Audit trail updates
  - Change tracking
- **Response**: Updated product with relationships

#### DELETE /products/:id
- **Description**: Soft delete product
- **Parameters**: `id` - Product ID
- **Validation**: Prevents deletion if product has pending sales
- **Features**: Soft delete with audit trail
- **Response**: Success confirmation

### Product Variations

#### GET /products/:id/variations
- **Description**: Get all variations for a product
- **Parameters**: `id` - Product ID
- **Response**: List of active product variations

#### POST /products/:id/variations
- **Description**: Create new product variation
- **Parameters**: `id` - Product ID
- **Body**: Variation data (name, value, price adjustment, etc.)
- **Response**: Created variation

#### PUT /products/:productId/variations/:variationId
- **Description**: Update product variation
- **Parameters**: 
  - `productId` - Product ID
  - `variationId` - Variation ID
- **Body**: Variation update data
- **Response**: Updated variation

#### DELETE /products/:productId/variations/:variationId
- **Description**: Deactivate product variation
- **Parameters**: 
  - `productId` - Product ID
  - `variationId` - Variation ID
- **Response**: Success confirmation

### Stock Management

#### PUT /products/:id/stock
- **Description**: Update product stock levels
- **Parameters**: `id` - Product ID
- **Body**:
  ```json
  {
    "quantity": 10,        // Positive for increase, negative for decrease
    "reason": "Manual adjustment",
    "type": "ADJUSTMENT"   // ADJUSTMENT, SALE, PURCHASE, etc.
  }
  ```
- **Features**: 
  - Automatic inventory movement logging
  - Stock level validation (no negative stock)
  - Audit trail creation
- **Response**: Updated product with stock changes

#### GET /products/reports/low-stock
- **Description**: Get products with low stock levels
- **Query Parameters**: `limit` (number, default: 50)
- **Features**: 
  - Products where current stock <= minimum stock level
  - Sorted by stock percentage (lowest first)
  - Includes category and supplier info
- **Response**: List of low-stock products with details

#### POST /products/:id/restock
- **Description**: Restock product (purchase/receive inventory)
- **Parameters**: `id` - Product ID
- **Body**:
  ```json
  {
    "quantity": 50,
    "unitCost": 1200.00,
    "supplierInvoice": "INV-2024-001",
    "notes": "Weekly restock"
  }
  ```
- **Features**: 
  - Stock level updates
  - Cost tracking
  - Purchase order linking
  - Inventory movement logging
- **Response**: Updated product with restock details

#### GET /products/:id/stock-history
- **Description**: Get stock movement history for product
- **Parameters**: `id` - Product ID
- **Query Parameters**: `page`, `limit` for pagination
- **Response**: Paginated list of inventory movements with details

### Image Management

#### POST /products/:id/images
- **Description**: Upload product images
- **Parameters**: `id` - Product ID
- **Body**:
  ```json
  {
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  }
  ```
- **Features**: 
  - Multiple image upload
  - Automatic sort order assignment
  - Alt text generation
- **Response**: Created image records

#### DELETE /products/:productId/images/:imageId
- **Description**: Delete product image
- **Parameters**: 
  - `productId` - Product ID
  - `imageId` - Image ID
- **Response**: Success confirmation

## Product Controller (src/controllers/products.controller.ts)

### Key Features

#### Data Processing
- **Decimal Handling**: Proper decimal conversion for prices and monetary values
- **Validation**: Comprehensive input validation and business rule enforcement
- **Error Handling**: Consistent error responses with detailed logging

#### Business Logic
- **SKU Generation**: Automatic SKU generation based on category and brand
- **Barcode Generation**: Automatic barcode generation for new products
- **Stock Management**: Real-time stock tracking with inventory movements
- **Price Hierarchy**: Support for cost, wholesale, retail, and minimum prices

#### Audit and Security
- **Audit Trail**: Complete audit logging for all operations
- **Soft Delete**: Products are soft-deleted to maintain referential integrity
- **User Tracking**: Track who created/modified products
- **Validation**: Prevent operations that would violate business rules

#### Performance Features
- **Pagination**: Efficient pagination for large datasets
- **Selective Loading**: Include only necessary relationships
- **Query Optimization**: Optimized database queries with proper indexing
- **Caching Ready**: Structure supports caching implementations

### Example Usage

#### Create Product
```typescript
// POST /api/products
const productData = {
  name: "iPhone 15 Pro Case",
  description: "Premium silicone case for iPhone 15 Pro",
  categoryId: "cat_123",
  supplierId: "sup_456",
  costPrice: 1500.00,
  wholesalePrice: 2000.00,
  retailPrice: 3000.00,
  minPrice: 1800.00,
  stockQuantity: 50,
  minStockLevel: 10,
  brand: "Apple",
  model: "iPhone 15 Pro",
  tags: ["cases", "accessories", "premium"]
};
```

#### Advanced Product Search
```typescript
// GET /api/products?query=iPhone&categoryId=cat_123&minPrice=1000&maxPrice=5000&page=1&limit=20
const searchParams = {
  query: "iPhone",
  categoryId: "cat_123",
  minPrice: 1000,
  maxPrice: 5000,
  inStock: true,
  sortBy: "name",
  sortOrder: "asc",
  page: 1,
  limit: 20
};
```

#### Stock Management
```typescript
// PUT /api/products/prod_123/stock
const stockUpdate = {
  quantity: -5,  // Reduce by 5 units
  reason: "Sale transaction",
  type: "SALE"
};

// POST /api/products/prod_123/restock
const restockData = {
  quantity: 100,
  unitCost: 1400.00,
  notes: "Monthly restock from supplier"
};
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2024-08-14T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    // Array of items
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2024-08-14T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND",
  "timestamp": "2024-08-14T10:30:00Z"
}
```

## Integration Notes

### Frontend Integration
- Use the paginated endpoints for list views
- Implement search and filtering UI components
- Handle loading states for async operations
- Implement optimistic updates where appropriate

### Mobile App Integration
- Use the same endpoints with appropriate page sizes
- Implement offline synchronization if needed
- Cache frequently accessed data
- Use image optimization for mobile displays

### External System Integration
- Product data can be exported via the list endpoints
- Stock levels can be synchronized in real-time
- Inventory movements provide audit trail for accounting systems
- Price changes are tracked for reporting

## Future Enhancements

### Planned Features
- Bulk product import/export
- Product templates and cloning
- Advanced price management (promotional pricing)
- Product bundling and kits
- Integration with barcode scanners
- Real-time stock alerts via WebSocket
- Product performance analytics
- Supplier catalog integration

### Scalability Considerations
- Database indexing optimization
- Caching layer implementation
- Image CDN integration
- Background job processing for bulk operations
- Read replica support for reporting queries

This documentation provides a comprehensive guide for implementing and using the product management API in your Vevurn POS system.
