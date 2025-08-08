# Product API Documentation

## Overview
Complete Product Management API for the Vevurn POS system. Supports full CRUD operations, inventory management, image uploads, and advanced search functionality.

## Base URL
```
/api/products
```

## Authentication
All endpoints (except health check) require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Health Check
**GET** `/health`
- **Description**: Check service status
- **Authentication**: Not required
- **Response**:
```json
{
  "status": "ok",
  "service": "products"
}
```

### 2. Create Product
**POST** `/`
- **Description**: Create a new product
- **Rate Limited**: Yes
- **Body**:
```json
{
  "name": "Samsung Galaxy S24",
  "description": "Latest Samsung flagship smartphone",
  "categoryId": "uuid-here",
  "brand": "Samsung",
  "model": "Galaxy S24",
  "sku": "SAMS24-001",
  "barcode": "8801234567890",
  "basePriceRwf": 850000,
  "minPriceRwf": 800000,
  "maxDiscountPercent": 10,
  "wholesalePriceRwf": 750000,
  "basePriceUsd": 850,
  "minPriceUsd": 800,
  "wholesalePriceUsd": 750,
  "basePriceEur": 800,
  "minPriceEur": 750,
  "wholesalePriceEur": 700,
  "stockQuantity": 50,
  "minStockLevel": 5,
  "maxStockLevel": 100,
  "reorderPoint": 10,
  "supplierIds": ["supplier-uuid-1", "supplier-uuid-2"],
  "images": ["https://example.com/image1.jpg"],
  "specifications": {
    "color": "Black",
    "storage": "256GB",
    "ram": "8GB"
  }
}
```
- **Response**: Product object with full details

### 3. Get Products
**GET** `/`
- **Description**: Get products with filtering and pagination
- **Query Parameters**:
  - `categoryId`: Filter by category ID
  - `search`: Search in name, description, brand, model, SKU
  - `minPrice`: Minimum price filter
  - `maxPrice`: Maximum price filter
  - `inStock`: Filter products in stock (boolean)
  - `lowStock`: Filter low stock products (boolean)
  - `supplierIds`: Filter by supplier IDs (comma-separated)
  - `limit`: Number of products per page (1-100, default: 20)
  - `offset`: Number of products to skip (default: 0)
  - `sortBy`: Sort field (name|basePriceRwf|stockQuantity|createdAt, default: name)
  - `sortOrder`: Sort order (asc|desc, default: asc)

- **Example**: `/products?search=Samsung&categoryId=uuid&limit=10&sortBy=basePriceRwf&sortOrder=desc`

- **Response**:
```json
{
  "success": true,
  "data": [...products],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 4. Get Product by ID
**GET** `/:id`
- **Description**: Get single product with full details
- **Parameters**: `id` - Product UUID
- **Response**: Product object with category, suppliers, and stock movements

### 5. Update Product
**PUT** `/:id`
- **Description**: Update product information
- **Rate Limited**: Yes
- **Parameters**: `id` - Product UUID
- **Body**: Partial product object (same structure as create, but all fields optional)
- **Response**: Updated product object

### 6. Delete Product
**DELETE** `/:id`
- **Description**: Delete product (soft delete if has sales history)
- **Rate Limited**: Yes
- **Parameters**: `id` - Product UUID
- **Response**:
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### 7. Update Stock
**PATCH** `/:id/stock`
- **Description**: Update product stock quantity with audit trail
- **Rate Limited**: Yes
- **Parameters**: `id` - Product UUID
- **Body**:
```json
{
  "quantity": 45,
  "reason": "Sold 5 units",
  "referenceId": "sale-ref-123"
}
```
- **Response**: Updated product with new stock quantity

### 8. Upload Images
**POST** `/:id/images`
- **Description**: Upload product images to S3
- **Parameters**: `id` - Product UUID
- **Content-Type**: `multipart/form-data`
- **Form Data**: `images` - Array of image files (max 5, 5MB each)
- **Supported Formats**: JPEG, PNG, WebP
- **Response**:
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": {
    "imageUrls": ["https://s3.../image1.jpg", "https://s3.../image2.jpg"]
  }
}
```

### 9. Search Products
**GET** `/search`
- **Description**: Full-text search across products
- **Query Parameters**:
  - `q`: Search query (required)
  - `limit`: Number of results (default: 10)
- **Example**: `/products/search?q=Samsung Galaxy&limit=20`
- **Response**: Array of matching products

### 10. Get Low Stock Products
**GET** `/low-stock`
- **Description**: Get products with low stock levels
- **Response**: Array of products below their minimum stock level

### 11. Get Categories
**GET** `/categories`
- **Description**: Get product categories with product counts
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "category": "Smartphones",
      "count": 25
    },
    {
      "category": "Laptops",
      "count": 15
    }
  ]
}
```

### 12. Export Products
**GET** `/export`
- **Description**: Export products to CSV format
- **Query Parameters**: Same as Get Products
- **Response**: CSV file download
- **Content-Type**: `text/csv`
- **Filename**: `products.csv`

### 13. Bulk Update Products
**PATCH** `/bulk/update`
- **Description**: Update multiple products in one request
- **Rate Limited**: Yes
- **Body**:
```json
{
  "updates": [
    {
      "id": "product-uuid-1",
      "basePriceRwf": 800000,
      "stockQuantity": 40
    },
    {
      "id": "product-uuid-2",
      "minPriceRwf": 750000
    }
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Bulk update completed. 2 successful, 0 failed",
  "data": {
    "successful": [...],
    "failed": [...]
  }
}
```

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["name"],
      "message": "Expected string, received number"
    }
  ]
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "message": "Product not found"
}
```

### Rate Limit Errors (429)
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

### Server Errors (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Data Models

### Product Object
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "sku": "string",
  "barcode": "string | null",
  "brand": "string | null",
  "model": "string | null",
  "color": "string | null",
  "basePriceRwf": "number",
  "minPriceRwf": "number",
  "maxDiscountPercent": "number",
  "wholesalePriceRwf": "number | null",
  "basePriceUsd": "number | null",
  "minPriceUsd": "number | null",
  "wholesalePriceUsd": "number | null",
  "basePriceEur": "number | null",
  "minPriceEur": "number | null",
  "wholesalePriceEur": "number | null",
  "stockQuantity": "number",
  "minStockLevel": "number",
  "maxStockLevel": "number | null",
  "reorderPoint": "number",
  "images": "string[]",
  "specifications": "object | null",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "categoryId": "string",
  "category": {
    "id": "string",
    "name": "string"
  },
  "suppliers": [
    {
      "supplier": {
        "id": "string",
        "name": "string"
      },
      "supplierSku": "string | null",
      "supplierPrice": "number | null"
    }
  ],
  "stockMovements": [
    {
      "id": "string",
      "type": "SALE | RESTOCK | ADJUSTMENT | DAMAGE | RETURN",
      "quantity": "number",
      "stockBefore": "number",
      "stockAfter": "number",
      "reason": "string",
      "createdAt": "datetime",
      "user": {
        "firstName": "string",
        "lastName": "string"
      }
    }
  ]
}
```

## Rate Limiting
- Create, Update, Delete, Stock Update, and Bulk operations are rate-limited
- Default: 100 requests per 15 minutes per user
- Rate limit headers included in responses

## Caching
- Product data is cached with Redis for performance
- Cache TTL: 1 hour for product lists, 30 minutes for individual products
- Cache is automatically invalidated on updates

## File Upload Specifications
- **Max File Size**: 5MB per image
- **Max Files**: 5 images per upload
- **Supported Formats**: JPEG, PNG, WebP
- **Storage**: Amazon S3 with CDN
- **Naming**: Auto-generated unique names with product ID folder structure
