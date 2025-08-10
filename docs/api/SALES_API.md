# Sales API Documentation

## Overview
The Sales API provides comprehensive functionality for managing point-of-sale transactions, including sale creation, payment processing, analytics, and reporting.

## Authentication
All endpoints (except health check) require authentication via the `authMiddleware`. User information is available in `req.user`.

## Base URL
```
/api/sales
```

## Endpoints

### Health Check
```http
GET /api/sales/health
```
**Description:** Check if the sales service is running  
**Authentication:** None required  
**Response:**
```json
{
  "status": "ok",
  "service": "sales"
}
```

### Create Sale
```http
POST /api/sales
```
**Description:** Create a new sale transaction  
**Authentication:** Required (any authenticated user)  
**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerPhone": "+250788123456",
  "customerEmail": "john@example.com",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "basePrice": 1000,
      "negotiatedPrice": 950,
      "discountAmount": 50,
      "discountPercentage": 5,
      "discountReason": "Customer loyalty"
    }
  ],
  "paymentMethod": "CASH",
  "paymentStatus": "COMPLETED",
  "subtotal": 1900,
  "taxAmount": 190,
  "discountAmount": 100,
  "totalAmount": 1990,
  "currency": "RWF",
  "mtnTransactionId": "MTN123456789",
  "staffNotes": "Regular customer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "id": "uuid",
    "receiptNumber": "VEV202408080001",
    "customerName": "John Doe",
    "totalAmount": 1990,
    "currency": "RWF",
    "paymentMethod": "CASH",
    "status": "COMPLETED",
    "createdAt": "2024-08-08T10:00:00Z",
    "cashier": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "items": [...],
    "payments": [...]
  }
}
```

### Get Sales
```http
GET /api/sales
```
**Description:** Retrieve sales with filtering and pagination  
**Authentication:** Required  
**Query Parameters:**
- `cashierId` (string, optional): Filter by cashier ID
- `customerName` (string, optional): Filter by customer name (partial match)
- `status` (enum, optional): DRAFT, COMPLETED, CANCELLED, REFUNDED
- `paymentMethod` (enum, optional): CASH, MTN_MOBILE_MONEY, CARD, BANK_TRANSFER
- `paymentStatus` (enum, optional): PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED
- `dateFrom` (date, optional): Start date filter
- `dateTo` (date, optional): End date filter
- `minAmount` (number, optional): Minimum amount filter
- `maxAmount` (number, optional): Maximum amount filter
- `limit` (number, optional, default: 20): Page size
- `offset` (number, optional, default: 0): Page offset
- `sortBy` (enum, optional, default: createdAt): createdAt, totalAmount, receiptNumber
- `sortOrder` (enum, optional, default: desc): asc, desc

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Sale by ID
```http
GET /api/sales/:id
```
**Description:** Retrieve a specific sale by ID  
**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "receiptNumber": "VEV202408080001",
    "customerName": "John Doe",
    "items": [
      {
        "id": "uuid",
        "quantity": 2,
        "basePrice": 1000,
        "negotiatedPrice": 950,
        "totalPrice": 1900,
        "product": {
          "name": "Product Name",
          "sku": "PROD001"
        }
      }
    ],
    "cashier": {
      "firstName": "Jane",
      "lastName": "Smith"
    }
  }
}
```

### Update Sale Status
```http
PATCH /api/sales/:id/status
```
**Description:** Update sale status and payment status  
**Authentication:** Required (supervisor/manager/admin roles only)  
**Request Body:**
```json
{
  "status": "COMPLETED",
  "paymentStatus": "COMPLETED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sale status updated successfully",
  "data": {...}
}
```

### Update MTN Payment
```http
PATCH /api/sales/:id/mtn-payment
```
**Description:** Update MTN Mobile Money payment information  
**Authentication:** Required (supervisor/manager/admin roles only)  
**Request Body:**
```json
{
  "saleId": "uuid",
  "mtnTransactionId": "MTN123456789",
  "mtnStatus": "SUCCESSFUL"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MTN payment updated successfully",
  "data": {...}
}
```

### Get Sales Analytics
```http
GET /api/sales/analytics
```
**Description:** Get sales analytics for a date range  
**Authentication:** Required  
**Query Parameters:**
- `dateFrom` (date, required): Start date
- `dateTo` (date, required): End date
- `cashierId` (string, optional): Filter by cashier

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 150,
    "totalRevenue": 2500000,
    "averageSaleValue": 16666.67,
    "salesByMethod": [
      {
        "paymentMethod": "CASH",
        "_count": { "paymentMethod": 100 },
        "_sum": { "totalAmount": 1500000 }
      }
    ],
    "topProducts": [
      {
        "productId": "uuid",
        "_sum": { "quantity": 50, "totalPrice": 500000 },
        "product": {
          "name": "Top Product",
          "sku": "TOP001"
        }
      }
    ]
  }
}
```

### Get Daily Summary
```http
GET /api/sales/daily-summary
```
**Description:** Get sales summary for a specific day  
**Authentication:** Required  
**Query Parameters:**
- `date` (date, optional, default: today): Target date
- `cashierId` (string, optional): Filter by cashier

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-08-08",
    "totalSales": 25,
    "totalRevenue": 450000,
    "averageSaleValue": 18000
  }
}
```

### Export Sales to CSV
```http
GET /api/sales/export/csv
```
**Description:** Export sales data to CSV format  
**Authentication:** Required (supervisor/manager/admin roles only)  
**Query Parameters:** Same as Get Sales endpoint  
**Response:** CSV file download

### Get Receipt Data
```http
GET /api/sales/:id/receipt
```
**Description:** Get formatted receipt data for printing  
**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "receiptNumber": "VEV202408080001",
    "date": "2024-08-08T10:00:00Z",
    "cashier": "Jane Smith",
    "customer": {
      "name": "John Doe",
      "phone": "+250788123456"
    },
    "items": [...],
    "totals": {
      "subtotal": 1900,
      "taxAmount": 190,
      "discountAmount": 100,
      "totalAmount": 1990,
      "currency": "RWF"
    },
    "payment": {
      "method": "CASH",
      "status": "COMPLETED",
      "paidAmount": 2000,
      "changeAmount": 10
    }
  }
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["totalAmount"],
      "message": "Expected number, received string"
    }
  ]
}
```

### Not Found
```json
{
  "success": false,
  "message": "Sale not found"
}
```

### Insufficient Stock
```json
{
  "success": false,
  "message": "Insufficient stock for Product Name. Available: 5, Required: 10"
}
```

### Authentication Required
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### Access Denied
```json
{
  "success": false,
  "message": "Access denied. Required roles: supervisor, manager, admin"
}
```

## Business Logic Notes

### Sale Creation Process
1. Validates all input data using Zod schemas
2. Checks stock availability for all items
3. Creates sale record with generated receipt number
4. Creates sale items with product snapshots
5. Updates inventory quantities
6. Creates stock movement records
7. Returns complete sale with relations

### Receipt Number Format
- Pattern: `VEV{YYYYMMDD}{####}`
- Example: `VEV202408080001`
- Auto-incremented sequence per day

### Stock Management
- Automatic inventory deduction on sale creation
- Stock movement tracking for audit trail
- Reversal of inventory changes on payment failures

### Payment Processing
- Support for multiple payment methods
- MTN Mobile Money integration
- Payment status tracking
- Automatic status updates

### Role-Based Access Control
- **All authenticated users**: Can create sales, view sales, get analytics
- **Supervisor/Manager/Admin**: Can update sale status, export data, update payments
- **Admin**: Full access to all operations

### Caching Strategy
- Analytics results cached for 10 minutes
- Cache invalidation on sale updates
- Redis-based caching implementation
