# Sales API Documentation

## Overview
The Sales API provides comprehensive functionality for managing sales transactions, payment processing, and sales analytics in the Vevurn POS system.

## Base URL
```
/api/sales
```

## Authentication
All endpoints except webhooks require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Health Check
**GET** `/health`

Returns the health status of the sales service.

**Response:**
```json
{
  "status": "OK",
  "message": "Sales API is running"
}
```

---

### 2. Create Sale
**POST** `/`

Creates a new sale transaction with automatic inventory management.

**Request Body:**
```json
{
  "customerName": "John Doe", // optional
  "customerPhone": "+250788123456", // optional
  "customerEmail": "john@example.com", // optional
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "basePrice": 1000,
      "negotiatedPrice": 900,
      "discountAmount": 100,
      "discountPercentage": 10,
      "discountReason": "bulk_discount" // optional
    }
  ],
  "paymentMethod": "CASH", // CASH | MTN_MOBILE_MONEY | CARD | BANK_TRANSFER
  "paymentStatus": "COMPLETED", // PENDING | COMPLETED | FAILED
  "subtotal": 1800,
  "taxAmount": 324, // optional
  "discountAmount": 200, // optional
  "totalAmount": 1924,
  "currency": "RWF", // RWF | USD | EUR
  "mtnTransactionId": "mtn_trans_123", // optional, for MTN payments
  "staffNotes": "Customer requested gift wrapping" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "id": "sale_123",
    "receiptNumber": "VEV202508080001",
    "customerName": "John Doe",
    "cashier": {
      "id": "user_123",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "items": [...],
    "totalAmount": 1924,
    "currency": "RWF",
    "paymentMethod": "CASH",
    "paymentStatus": "COMPLETED",
    "status": "COMPLETED",
    "createdAt": "2025-08-08T10:30:00Z"
  }
}
```

---

### 3. Get Sales
**GET** `/`

Retrieves sales with filtering and pagination.

**Query Parameters:**
- `cashierId` (optional): Filter by cashier ID
- `customerName` (optional): Filter by customer name (partial match)
- `status` (optional): Filter by sale status
- `paymentMethod` (optional): Filter by payment method
- `paymentStatus` (optional): Filter by payment status
- `dateFrom` (optional): Start date for filtering (ISO 8601)
- `dateTo` (optional): End date for filtering (ISO 8601)
- `minAmount` (optional): Minimum total amount
- `maxAmount` (optional): Maximum total amount
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `sortBy` (optional): Sort field (createdAt | totalAmount | receiptNumber)
- `sortOrder` (optional): Sort direction (asc | desc, default: desc)

**Example:**
```
GET /api/sales?dateFrom=2025-08-01&dateTo=2025-08-08&paymentMethod=CASH&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sale_123",
      "receiptNumber": "VEV202508080001",
      "customerName": "John Doe",
      "cashier": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "totalAmount": 1924,
      "currency": "RWF",
      "paymentMethod": "CASH",
      "status": "COMPLETED",
      "createdAt": "2025-08-08T10:30:00Z",
      "_count": {
        "items": 3
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 4. Get Sale by ID
**GET** `/:id`

Retrieves detailed information about a specific sale.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sale_123",
    "receiptNumber": "VEV202508080001",
    "customerName": "John Doe",
    "customerPhone": "+250788123456",
    "cashier": {
      "id": "user_123",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "items": [
      {
        "id": "item_123",
        "productId": "prod_123",
        "quantity": 2,
        "basePrice": 1000,
        "negotiatedPrice": 900,
        "totalPrice": 1800,
        "discountAmount": 100,
        "product": {
          "name": "Sample Product",
          "sku": "SKU001"
        }
      }
    ],
    "subtotal": 1800,
    "taxAmount": 324,
    "discountAmount": 200,
    "totalAmount": 1924,
    "currency": "RWF",
    "paymentMethod": "CASH",
    "paymentStatus": "COMPLETED",
    "createdAt": "2025-08-08T10:30:00Z"
  }
}
```

---

### 5. Get Sales Analytics
**GET** `/analytics`

Retrieves sales analytics for a specified date range.

**Query Parameters:**
- `dateFrom` (required): Start date (ISO 8601)
- `dateTo` (required): End date (ISO 8601)
- `cashierId` (optional): Filter by specific cashier

**Example:**
```
GET /api/sales/analytics?dateFrom=2025-08-01&dateTo=2025-08-08
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 45,
    "totalRevenue": 2450000,
    "averageSaleValue": 54444.44,
    "salesByMethod": [
      {
        "paymentMethod": "CASH",
        "_count": { "paymentMethod": 25 },
        "_sum": { "totalAmount": 1200000 }
      },
      {
        "paymentMethod": "MTN_MOBILE_MONEY",
        "_count": { "paymentMethod": 20 },
        "_sum": { "totalAmount": 1250000 }
      }
    ],
    "topProducts": [
      {
        "productId": "prod_123",
        "_sum": { "quantity": 150, "totalPrice": 450000 },
        "_count": { "productId": 25 },
        "product": {
          "name": "Popular Product",
          "sku": "SKU001"
        }
      }
    ]
  }
}
```

---

### 6. Get Daily Summary
**GET** `/daily-summary`

Retrieves sales summary for a specific day.

**Query Parameters:**
- `date` (optional): Target date (YYYY-MM-DD format, defaults to today)

**Example:**
```
GET /api/sales/daily-summary?date=2025-08-08
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-08-08",
    "totalSales": 15,
    "totalRevenue": 750000,
    "averageSaleValue": 50000,
    "salesByMethod": [...],
    "topProducts": [...]
  }
}
```

---

### 7. Get Receipt
**GET** `/:id/receipt`

Retrieves formatted receipt data for printing.

**Response:**
```json
{
  "success": true,
  "data": {
    "receiptNumber": "VEV202508080001",
    "date": "2025-08-08T10:30:00Z",
    "cashier": {
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "customer": {
      "name": "John Doe",
      "phone": "+250788123456"
    },
    "items": [
      {
        "name": "Product Name",
        "sku": "SKU001",
        "quantity": 2,
        "basePrice": 1000,
        "negotiatedPrice": 900,
        "totalPrice": 1800,
        "discount": 100
      }
    ],
    "totals": {
      "subtotal": 1800,
      "taxAmount": 324,
      "discountAmount": 200,
      "totalAmount": 1924,
      "paidAmount": 1924,
      "changeAmount": 0
    },
    "payment": {
      "method": "CASH",
      "status": "COMPLETED"
    },
    "notes": "Thank you for shopping with us!"
  }
}
```

---

### 8. Update Sale Status
**PATCH** `/:id/status`

Updates the status of a sale. Requires supervisor/manager/admin role.

**Request Body:**
```json
{
  "status": "COMPLETED", // DRAFT | COMPLETED | CANCELLED | REFUNDED
  "paymentStatus": "COMPLETED" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sale status updated successfully",
  "data": {
    "id": "sale_123",
    "receiptNumber": "VEV202508080001",
    "status": "COMPLETED",
    "paymentStatus": "COMPLETED",
    "updatedAt": "2025-08-08T11:00:00Z"
  }
}
```

---

### 9. Export Sales to CSV
**GET** `/export/csv`

Exports sales data to CSV format. Requires supervisor/manager/admin role.

**Query Parameters:** Same as "Get Sales" endpoint

**Response:** CSV file with headers:
```
Receipt Number,Date,Cashier,Customer,Payment Method,Status,Total Amount,Currency
```

---

### 10. MTN Mobile Money Webhook
**POST** `/mtn/callback`

Webhook endpoint for MTN Mobile Money payment status updates. No authentication required.

**Request Body:**
```json
{
  "saleId": "sale_123",
  "mtnTransactionId": "mtn_trans_456",
  "mtnStatus": "SUCCESSFUL" // SUCCESSFUL | FAILED
}
```

**Response:**
```json
{
  "success": true,
  "message": "MTN payment updated successfully",
  "data": {
    "id": "sale_123",
    "mtnTransactionId": "mtn_trans_456",
    "mtnStatus": "SUCCESSFUL",
    "paymentStatus": "COMPLETED"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["customerName"]
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Sale not found"
}
```

### Insufficient Stock (400)
```json
{
  "success": false,
  "message": "Insufficient stock for Product Name. Available: 5, Required: 10"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Business Logic

### Receipt Number Format
- Format: `VEV{YYYY}{MM}{DD}{####}`
- Example: `VEV202508080001` (1st sale on August 8, 2025)
- Automatically increments daily sequence

### Inventory Management
- Stock quantities are automatically decremented upon sale creation
- Failed payments trigger automatic inventory reversal
- Stock movements are tracked for audit purposes

### Multi-Currency Support
- Base currency: RWF (Rwandan Franc)
- Supported: USD, EUR
- All calculations maintain precision

### Role-Based Access
- **All authenticated users**: Create sales, view sales, get analytics
- **Supervisor/Manager/Admin**: Update sale status, export data
- **Webhooks**: No authentication required (should implement signature verification in production)
