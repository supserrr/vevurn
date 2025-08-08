# Vevurn POS System - Backend

A comprehensive Point of Sale (POS) system backend built with Node.js, TypeScript, Express, and Prisma ORM.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Manager, Supervisor, Cashier)
- Secure password hashing with bcrypt
- Protected routes with middleware

### 📦 Product Management
- Complete CRUD operations for products
- Advanced inventory tracking with stock levels
- Category and supplier management
- Barcode support and batch operations
- Role-based product access control

### 🛒 Sales Management
- Comprehensive sales transaction handling
- Multi-item sales with individual pricing
- Multiple payment methods (Cash, MTN Mobile Money, Card, Bank Transfer)
- Automatic inventory deduction
- Receipt generation with sequential numbering
- Transaction rollback on payment failures

### 💳 Payment Processing
- MTN Mobile Money integration with webhooks
- Payment status tracking and updates
- Automatic inventory reversal on failed payments
- Multiple currency support (RWF, USD, EUR)

### 📊 Analytics & Reporting
- Real-time sales analytics
- Daily, weekly, monthly summaries
- Top-selling products analysis
- Cashier performance tracking
- Payment method distribution
- CSV export capabilities

### 🏪 Multi-Store Support
- Redis caching for improved performance
- Background job processing
- Real-time notifications via WebSocket
- Comprehensive error handling and logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: JWT
- **Validation**: Zod schemas
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **Process Management**: PM2

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   └── websocket/        # WebSocket handlers
├── tests/                # Test files
├── prisma/               # Database schema and migrations
├── scripts/              # Utility scripts
└── docs/                 # API documentation
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14+
- Redis 6+
- pnpm (package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vevurn/backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/vevurn_pos"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="24h"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # Server
   PORT=3001
   NODE_ENV="development"
   
   # MTN Mobile Money
   MTN_API_KEY="your-mtn-api-key"
   MTN_API_SECRET="your-mtn-api-secret"
   MTN_CALLBACK_URL="https://yourapp.com/api/sales/mtn/callback"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   pnpm prisma generate
   
   # Run migrations
   pnpm prisma migrate dev
   
   # Seed the database (optional)
   pnpm prisma db seed
   ```

5. **Start Redis**
   ```bash
   redis-server
   ```

6. **Start Development Server**
   ```bash
   pnpm dev
   ```

The server will start on `http://localhost:3001`

### Production Deployment

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Start production server**
   ```bash
   pnpm start
   ```

3. **Using PM2 (recommended)**
   ```bash
   pm2 start ecosystem.config.js
   ```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

#### Products
- `GET /products` - List products with filtering
- `POST /products` - Create new product (Admin/Manager)
- `GET /products/:id` - Get product details
- `PUT /products/:id` - Update product (Admin/Manager)
- `DELETE /products/:id` - Delete product (Admin only)
- `POST /products/batch` - Batch operations (Admin/Manager)

#### Sales
- `GET /sales` - List sales with filtering and pagination
- `POST /sales` - Create new sale
- `GET /sales/:id` - Get sale details
- `PATCH /sales/:id/status` - Update sale status (Supervisor+)
- `GET /sales/analytics` - Sales analytics
- `GET /sales/daily-summary` - Daily sales summary
- `GET /sales/:id/receipt` - Get receipt data
- `GET /sales/export/csv` - Export to CSV (Supervisor+)
- `POST /sales/mtn/callback` - MTN webhook (public)

For complete API documentation, see [Sales API Documentation](./docs/sales-api.md)

## Database Schema

### Core Entities

#### User
```typescript
{
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: Role // ADMIN | MANAGER | SUPERVISOR | CASHIER
  status: UserStatus // ACTIVE | INACTIVE | SUSPENDED
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Product
```typescript
{
  id: string
  name: string
  sku: string
  barcode?: string
  price: number
  cost?: number
  stockQuantity: number
  minStockLevel?: number
  categoryId?: string
  supplierId?: string
  status: ProductStatus // ACTIVE | INACTIVE | DISCONTINUED
  description?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Sale
```typescript
{
  id: string
  receiptNumber: string
  cashierId: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  subtotal: number
  taxAmount?: number
  discountAmount?: number
  totalAmount: number
  currency: Currency // RWF | USD | EUR
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: SaleStatus
  mtnTransactionId?: string
  mtnStatus?: string
  staffNotes?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### SaleItem
```typescript
{
  id: string
  saleId: string
  productId: string
  quantity: number
  basePrice: number
  negotiatedPrice: number
  totalPrice: number
  discountAmount?: number
  discountPercentage?: number
  discountReason?: string
}
```

## Testing

### Run Tests
```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# Test coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Test Structure
- **Unit Tests**: Individual service and utility function testing
- **Integration Tests**: Full API endpoint testing with database
- **E2E Tests**: Complete user journey testing

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Consistent naming conventions
- Comprehensive error handling

### Database Best Practices
- Use transactions for multi-table operations
- Implement proper indexing for performance
- Regular backup strategies
- Database connection pooling

### Security Considerations
- Input validation with Zod schemas
- SQL injection prevention with Prisma
- Rate limiting on API endpoints
- Secure password hashing
- JWT token expiration handling

### Performance Optimization
- Redis caching for frequently accessed data
- Database query optimization
- Response compression
- Efficient pagination
- Background job processing

## Monitoring & Logging

### Logging
The system uses Winston for structured logging:
- **Error logs**: Stored in `logs/error.log`
- **Combined logs**: Stored in `logs/combined.log`
- **Console output**: Development environment

### Health Checks
- `GET /health` - Basic health check
- `GET /api/sales/health` - Sales service health
- Database connection monitoring
- Redis connection monitoring

### Metrics
- API response times
- Error rates
- Database query performance
- Active user sessions
- Sales transaction volumes

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   pg_isready -h localhost -p 5432
   
   # Verify connection string
   echo $DATABASE_URL
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Verify Redis URL
   echo $REDIS_URL
   ```

3. **Permission Issues**
   - Verify user roles in database
   - Check JWT token validity
   - Ensure proper middleware order

4. **Stock Issues**
   - Check product stock levels
   - Verify transaction rollbacks
   - Review inventory logs

### Support

For technical support or questions:
1. Check the [API documentation](./docs/sales-api.md)
2. Review the test files for usage examples
3. Check logs for detailed error messages
4. Create an issue in the repository

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Ensure all tests pass
5. Submit a pull request

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
pnpm test

# Commit changes
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
