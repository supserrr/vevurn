# Vevurn POS API Documentation

## 🚀 **Overview**

The Vevurn POS API is a comprehensive RESTful API built with Express.js and TypeScript, providing complete backend functionality for a modern Point of Sale system.

**Base URL**: `http://localhost:8000/api` (development)  
**Production URL**: `https://api.vevurn.com/api`

## 🔐 **Authentication**

All protected endpoints require a JWT Bearer token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "admin"
    },
    "token": "jwt_token_here",
    "expiresIn": "24h"
  }
}
```

## 🏪 **API Endpoints**

### **Health Check**
```http
GET /health
GET /api/health
```

### **👤 Users Management**

#### Get Current User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Get All Users (Admin)
```http
GET /api/users?page=1&limit=10&search=john&role=cashier
Authorization: Bearer <token>
```

#### Create User (Admin)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "role": "cashier",
  "maxDiscountAllowed": 5,
  "canSellBelowMin": false
}
```

### **👥 Customers Management**

#### Get All Customers
```http
GET /api/customers?page=1&limit=10&search=john&isActive=true
Authorization: Bearer <token>
```

#### Get Customer Details
```http
GET /api/customers/:id
Authorization: Bearer <token>
```

#### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

#### Update Customer
```http
PUT /api/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "johnsmith@example.com"
}
```

#### Customer Analytics (Supervisor+)
```http
GET /api/customers/analytics
Authorization: Bearer <token>
```

#### Export Customers (Manager+)
```http
GET /api/customers/export
Authorization: Bearer <token>
```

### **📦 Products Management**

#### Get All Products
```http
GET /api/products?page=1&limit=10&search=iphone&category=electronics
Authorization: Bearer <token>
```

#### Get Product Details
```http
GET /api/products/:id
Authorization: Bearer <token>
```

#### Create Product (Manager+)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone Case",
  "description": "Protective case for iPhone",
  "sku": "IPHONE_CASE_001",
  "category": "accessories",
  "sellingPriceRwf": 15000,
  "costPriceRwf": 10000,
  "stockQuantity": 100,
  "lowStockThreshold": 10
}
```

#### Update Product Stock (Supervisor+)
```http
PATCH /api/products/:id/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 50,
  "operation": "add"
}
```

#### Get Low Stock Products
```http
GET /api/products/low-stock
Authorization: Bearer <token>
```

### **🏷️ Categories Management**

#### Health Check
```http
GET /api/categories/health
```

#### Get All Categories
```http
GET /api/categories
Authorization: Bearer <token>
```

### **🏢 Suppliers Management**

#### Get All Suppliers
```http
GET /api/suppliers?page=1&limit=10&search=apple
Authorization: Bearer <token>
```

#### Create Supplier
```http
POST /api/suppliers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Apple Inc",
  "contact": "John Smith",
  "email": "contact@apple.com",
  "phone": "+1-800-APL-CARE",
  "address": "1 Apple Park Way, Cupertino, CA"
}
```

### **💰 Sales Management**

#### Get All Sales
```http
GET /api/sales?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Create Sale
```http
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "unitPrice": 15000
    }
  ],
  "paymentMethod": "cash",
  "totalAmount": 30000
}
```

#### Get Sale Details
```http
GET /api/sales/:id
Authorization: Bearer <token>
```

#### Sales Analytics
```http
GET /api/sales/analytics?period=monthly&year=2024&month=8
Authorization: Bearer <token>
```

#### Daily Sales Summary
```http
GET /api/sales/daily-summary?date=2024-08-08
Authorization: Bearer <token>
```

### **💳 Loans Management**

#### Get All Loans
```http
GET /api/loans?page=1&limit=10&status=pending&customerId=customer_id
Authorization: Bearer <token>
```

#### Create Loan
```http
POST /api/loans
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer_id",
  "amount": 100000,
  "description": "Purchase loan for electronics",
  "dueDate": "2024-09-08T00:00:00Z",
  "interestRate": 5
}
```

#### Record Payment
```http
POST /api/loans/:id/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 25000,
  "paymentMethod": "cash",
  "notes": "Partial payment"
}
```

#### Loans Summary
```http
GET /api/loans/summary
Authorization: Bearer <token>
```

### **📊 Reports**

#### Dashboard Summary
```http
GET /api/reports/dashboard
Authorization: Bearer <token>
```

#### Sales Report
```http
GET /api/reports/sales?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
Authorization: Bearer <token>
```

#### Inventory Report
```http
GET /api/reports/inventory?lowStock=true
Authorization: Bearer <token>
```

#### Staff Report (Manager+)
```http
GET /api/reports/staff?period=monthly&staffId=user_id
Authorization: Bearer <token>
```

#### Financial Report (Manager+)
```http
GET /api/reports/financial?year=2024&month=8
Authorization: Bearer <token>
```

### **⚙️ Settings**

#### Get Settings
```http
GET /api/settings
Authorization: Bearer <token>
```

#### Update Settings (Admin)
```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "storeName": "My POS Store",
  "currency": "RWF",
  "taxRate": 18,
  "lowStockThreshold": 10
}
```

#### System Statistics (Manager+)
```http
GET /api/settings/stats
Authorization: Bearer <token>
```

## 🔒 **Permission Levels**

| Role | Level | Permissions |
|------|-------|-------------|
| **cashier** | 1 | Basic sales, customer lookup |
| **supervisor** | 2 | All cashier + product updates, stock management |
| **manager** | 3 | All supervisor + reports, user management, settings |
| **admin** | 4 | Full system access |

## 📝 **Response Format**

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

## 🚀 **Rate Limiting**

API requests are rate-limited:
- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Reports endpoints**: 10 requests per minute

## 🔧 **Development**

### Testing API Endpoints

```bash
# Start backend server
cd backend && npm run dev

# Test health endpoint
curl http://localhost:8000/health

# Test with authentication
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/users/profile
```

### API Client Example (JavaScript)

```javascript
class VevurnAPI {
  constructor(baseURL = 'http://localhost:8000/api', token = null) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    const response = await fetch(url, config);
    return response.json();
  }

  // Get all customers
  async getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers${query ? `?${query}` : ''}`);
  }

  // Create customer
  async createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }
}

// Usage
const api = new VevurnAPI('http://localhost:8000/api', 'your-jwt-token');
const customers = await api.getCustomers({ page: 1, limit: 10 });
```

## 📚 **Additional Resources**

- [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

**Last Updated**: August 8, 2025  
**API Version**: v1.0  
**Backend Status**: ✅ Complete & Production Ready
