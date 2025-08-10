# Vevurn POS System API Documentation

Complete API reference for the Vevurn Point of Sale system backend services.

## Base URL
```
http://localhost:3001/api  # Development
https://your-domain.com/api  # Production
```

## Authentication
The system uses Better Auth for authentication and authorization. All protected endpoints require:
- Valid session cookie or Authorization Bearer token
- Appropriate role permissions (cashier, supervisor, manager, admin)

### Auth Endpoints
All authentication endpoints are handled by Better Auth:
```
POST /api/auth/sign-in
POST /api/auth/sign-up
POST /api/auth/sign-out
GET /api/auth/session
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

## API Modules

### 1. Core Business Operations

#### Sales API (`/api/sales`)
**Purpose:** Handle sales transactions, receipts, and sales management
- `GET /api/sales` - List all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale details
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Cancel/void sale
- `POST /api/sales/:id/refund` - Process refund
- `GET /api/sales/:id/receipt` - Generate receipt

**Access Levels:**
- Read: All authenticated users
- Create/Update: Cashier and above
- Delete/Refund: Supervisor and above

#### Products API (`/api/products`)
**Purpose:** Product catalog management, inventory tracking
- `GET /api/products` - List products with filtering
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PUT /api/products/:id/stock` - Update stock levels
- `GET /api/products/low-stock` - Get low stock alerts

**Access Levels:**
- Read: All authenticated users
- Create/Update: Manager and above
- Delete: Admin only
- Stock Updates: Supervisor and above

#### Categories API (`/api/categories`)
**Purpose:** Product category management
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get category details
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

**Access Levels:**
- Read: All authenticated users
- Create/Update/Delete: Manager and above

#### Customers API (`/api/customers`)
**Purpose:** Customer relationship management
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/history` - Purchase history

**Access Levels:**
- Read: All authenticated users
- Create/Update: Cashier and above
- Delete: Manager and above

#### Suppliers API (`/api/suppliers`)
**Purpose:** Supplier and procurement management
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/:id` - Get supplier details
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

**Access Levels:**
- Read: All authenticated users
- Create/Update/Delete: Manager and above

### 2. Financial Services

#### Loans API (`/api/loans`)
**Purpose:** Customer loan and credit management
- `GET /api/loans` - List loans
- `POST /api/loans` - Create loan
- `GET /api/loans/:id` - Get loan details
- `PUT /api/loans/:id` - Update loan
- `POST /api/loans/:id/payment` - Record payment
- `GET /api/loans/overdue` - Get overdue loans

**Access Levels:**
- Read: Supervisor and above
- Create/Update: Manager and above
- Payments: Supervisor and above

#### Mobile Money API (`/api/mobile-money`)
**Purpose:** MTN Mobile Money integration for payments
- `POST /api/mobile-money/pay` - Process payment
- `GET /api/mobile-money/status/:id` - Check payment status
- `POST /api/mobile-money/refund` - Process refund
- `GET /api/mobile-money/balance` - Check account balance

**Access Levels:**
- All operations: Cashier and above

#### Pricing API (`/api/pricing`)
**Purpose:** Dynamic pricing and promotions
- `GET /api/pricing/rules` - List pricing rules
- `POST /api/pricing/rules` - Create pricing rule
- `PUT /api/pricing/rules/:id` - Update pricing rule
- `DELETE /api/pricing/rules/:id` - Delete pricing rule
- `POST /api/pricing/calculate` - Calculate price with rules

**Access Levels:**
- Read: All authenticated users
- Create/Update/Delete: Manager and above

### 3. Business Intelligence

#### Analytics API (`/api/analytics`)
**Purpose:** Advanced business analytics and insights
- `GET /api/analytics/profit-margins` - Profit margin analysis
- `GET /api/analytics/customer-ltv` - Customer lifetime value
- `GET /api/analytics/inventory-aging` - Inventory aging report
- `GET /api/analytics/sales-trends` - Sales trend analysis
- `GET /api/analytics/top-products` - Top selling products
- `GET /api/analytics/performance` - Performance metrics

**Key Features:**
- Real-time calculations with Redis caching
- Date range filtering and custom time periods
- Product, category, and customer segmentation
- Performance optimization with intelligent caching

**Access Levels:**
- All endpoints: Manager and above

#### Reports API (`/api/reports`)
**Purpose:** Standard business reports
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports  
- `GET /api/reports/financial` - Financial reports
- `GET /api/reports/custom` - Custom report builder

**Access Levels:**
- Read: Manager and above

#### Exports API (`/api/exports`)
**Purpose:** Advanced report generation and automated scheduling
- `GET /api/exports/templates` - Get export options
- `POST /api/exports/generate` - Generate report (CSV/Excel/PDF)
- `POST /api/exports/schedule` - Schedule automated reports
- `GET /api/exports/scheduled` - List scheduled reports
- `PUT /api/exports/scheduled/:id` - Update scheduled report
- `DELETE /api/exports/scheduled/:id` - Delete scheduled report
- `POST /api/exports/test/:id` - Test scheduled export

**Key Features:**
- Multiple formats: CSV, Excel, PDF
- Automated scheduling with cron expressions
- Email delivery with S3 cloud storage
- Custom filtering and column selection
- Chart generation for PDF reports

**Access Levels:**
- Generate reports: Manager and above
- Schedule management: Admin only

### 5. GDPR Compliance & Privacy

#### GDPR Compliance API (`/api/gdpr`)
**Purpose:** Comprehensive data protection and privacy compliance
- `POST /api/gdpr/export/request` - Request data export (Article 20)
- `GET /api/gdpr/export/:id` - Get export status
- `POST /api/gdpr/deletion/request` - Request data deletion (Article 17)
- `DELETE /api/gdpr/deletion/:id/cancel` - Cancel deletion request
- `GET /api/gdpr/deletion/:id` - Get deletion status
- `POST /api/gdpr/consent` - Record user consent (Article 21)
- `GET /api/gdpr/consent/:userId` - Get user consents
- `POST /api/gdpr/retention-policy` - Set retention policies
- `POST /api/gdpr/retention-policy/apply` - Apply retention policies
- `GET /api/gdpr/compliance-info` - Get compliance information

**Key Features:**
- Complete data export with encryption and secure delivery
- Automated data deletion with 30-day cancellation period
- Comprehensive consent management system
- Configurable data retention policies with automated enforcement
- Audit trail for all privacy operations
- Legal compliance with GDPR, CCPA, and similar regulations

**Access Levels:**
- Data export/deletion: Self or Admin
- Consent management: Self only
- Retention policies: Admin only
- Compliance info: All authenticated users

### 6. System Management

#### Users API (`/api/users`)
**Purpose:** User management and role assignments
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/role` - Update user role

**Access Levels:**
- Read: Manager and above
- Create/Update/Delete: Admin only

#### Settings API (`/api/settings`)
**Purpose:** System configuration and preferences
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/:key` - Get specific setting
- `PUT /api/settings/:key` - Update specific setting

**Access Levels:**
- Read: Manager and above
- Update: Admin only

### 5. System Health

#### Health Endpoints
- `GET /health` - Basic server health check
- `GET /api/health` - API health check with detailed status

**Response Format:**
```json
{
  "status": "ok",
  "service": "vevurn-pos-backend",
  "timestamp": "2024-01-31T14:30:00Z",
  "uptime": 3600.25
}
```

## Authentication & Authorization

### Role Hierarchy
1. **Admin** - Full system access
2. **Manager** - Business operations, reports, analytics
3. **Supervisor** - Sales oversight, customer management, loan payments
4. **Cashier** - Basic sales operations, customer creation

### Session Management
- Session-based authentication with secure HTTP-only cookies
- JWT tokens for API access
- Automatic session renewal on activity
- Secure logout with session invalidation

### Security Features
- Rate limiting on all API endpoints
- CORS protection with environment-based origins
- Helmet.js security headers
- Request logging for audit trails
- Error sanitization (no sensitive data in responses)

## Data Formats

### Standard Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-31T14:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "timestamp": "2024-01-31T14:30:00Z"
  }
}
```

### Pagination Format
```json
{
  "success": true,
  "data": [/* items */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Common Query Parameters

### Filtering
- `search` - Text search across relevant fields
- `status` - Filter by status
- `dateFrom` - Start date (ISO 8601)
- `dateTo` - End date (ISO 8601)
- `category` - Filter by category ID
- `customerId` - Filter by customer ID

### Sorting
- `sortBy` - Field to sort by
- `sortOrder` - `asc` or `desc`

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vevurn_pos
REDIS_URL=redis://localhost:6379

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3001

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AWS S3 (for exports)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=vevurn-exports

# MTN Mobile Money
MTN_API_KEY=your-mtn-api-key
MTN_API_SECRET=your-mtn-secret
MTN_SUBSCRIPTION_KEY=your-subscription-key
```

## Performance Considerations

### Caching Strategy
- Redis caching for frequently accessed data
- Analytics results cached for 5-15 minutes
- Product data cached with smart invalidation
- Session data stored in Redis for scalability

### Database Optimization
- Connection pooling with pgBouncer
- Optimized queries with proper indexing
- Prepared statements for common operations
- Batch operations for bulk updates

### Rate Limiting
- 100 requests per minute per IP for general API
- 10 requests per minute for export generation
- 5 requests per minute for analytics endpoints
- Burst allowance for authenticated users

## Error Codes Reference

### Authentication Errors
- `AUTH_REQUIRED` (401) - Authentication required
- `AUTH_INVALID` (401) - Invalid credentials
- `AUTH_EXPIRED` (401) - Session expired
- `PERMISSION_DENIED` (403) - Insufficient permissions

### Validation Errors
- `VALIDATION_ERROR` (400) - Request validation failed
- `MISSING_REQUIRED_FIELD` (400) - Required field missing
- `INVALID_FORMAT` (400) - Invalid data format

### Business Logic Errors
- `INSUFFICIENT_STOCK` (409) - Not enough stock for sale
- `CUSTOMER_NOT_FOUND` (404) - Customer does not exist
- `PRODUCT_NOT_FOUND` (404) - Product does not exist
- `LOAN_LIMIT_EXCEEDED` (409) - Customer loan limit exceeded

### System Errors
- `INTERNAL_ERROR` (500) - Internal server error
- `DATABASE_ERROR` (500) - Database operation failed
- `SERVICE_UNAVAILABLE` (503) - External service unavailable

## Development Tools

### API Testing
Postman collection available with pre-configured requests for all endpoints.

### Database Tools
- Prisma Studio for database GUI: `npx prisma studio`
- Database migrations: `npx prisma migrate dev`
- Schema generation: `npx prisma generate`

### Monitoring
- Request logging with Morgan
- Error tracking with custom error handler
- Performance metrics via Redis
- Health checks for all services

## Support & Resources

### Documentation Links
- [Analytics API Documentation](./api/Analytics-API.md)
- [Export API Documentation](./api/Export-API.md)
- [GDPR Compliance API Documentation](./api/GDPR-API.md)
- [Better Auth Integration Guide](./auth/BETTER_AUTH_COMPLETE_IMPLEMENTATION.md)
- [Database Schema Documentation](./database/schema.md)

### Development Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations: `npx prisma migrate dev`
4. Start development server: `npm run dev`
5. Access API at `http://localhost:3001/api`

### Production Deployment
- Docker support with multi-stage builds
- Health checks for container orchestration
- Graceful shutdown handling
- Environment-specific configurations
- SSL/TLS termination ready

---

*This API serves as the backbone for the Vevurn POS System, providing robust, scalable, and secure endpoints for all business operations.*
