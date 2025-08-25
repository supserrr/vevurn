# Vevurn POS System

A comprehensive point-of-sale system designed for phone accessories retail business in Rwanda, featuring mobile money integration, inventory management, and real-time reporting.

## 🚀 Features

### Core Functionality
- **Sales Management**: Complete POS interface with barcode scanning, customer management, and receipt generation
- **Inventory Management**: Real-time stock tracking, low-stock alerts, and automated reorder notifications
- **Customer Management**: Customer profiles, loyalty points, and purchase history
- **User Management**: Role-based access control (Super Admin, Admin, Manager, Cashier)
- **Reporting**: Sales reports, inventory reports, and business analytics

### Payment Integration
- **Cash Payments**: Traditional cash handling with change calculation
- **Mobile Money**: MTN Mobile Money and Airtel Money integration for Rwanda
- **Card Payments**: Support for credit/debit card transactions
- **Bank Transfers**: Bank transfer payment tracking

### Technical Features
- **Real-time Updates**: WebSocket integration for live inventory and sales updates
- **Multi-language Support**: Kinyarwanda, English, and French
- **Offline Capability**: Limited offline functionality with sync when online
- **Receipt Printing**: Thermal printer support for receipts
- **Barcode Generation**: Automatic barcode generation for products

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend** (`frontend/`): Next.js 15 with TypeScript, Tailwind CSS, and Shadcn/ui
- **Backend** (`backend/`): Node.js with Express, Prisma ORM, and PostgreSQL
- **Shared** (`shared/`): Common types, validation schemas, and utilities
- **Documentation** (`docs/`): Complete system documentation
- **Configuration** (`config/`): Centralized project configurations
- **Scripts** (`scripts/`): Build and deployment scripts
- **Tools** (`tools/`): Development tools and utilities

📁 **[Complete Project Structure](./PROJECT_STRUCTURE.md)** - Detailed file organization guide

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5.7+
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui with Radix UI
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Better Auth integration

### Backend
- **Runtime**: Node.js 22
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer with Sharp for image processing
- **Real-time**: Socket.io
- **Validation**: Zod
- **Logging**: Winston

### Infrastructure
- **Database**: PostgreSQL
- **File Storage**: Local storage (configurable for cloud)
- **Process Manager**: PM2 for production
- **Reverse Proxy**: Nginx (recommended)

## 🚦 Getting Started

### Prerequisites

- Node.js 22.16.0 or higher
- PostgreSQL 14 or higher
- npm 10.0.0 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/supserrr/vevurn.git
   cd vevurn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   
   # Update the following in backend/.env:
   # - DATABASE_URL with your PostgreSQL connection string
   # - JWT_SECRET with a secure secret key
   # - MTN Mobile Money credentials (for Rwanda)
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with initial data
   npm run db:seed
   ```

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   npm run dev:backend  # Backend on http://localhost:5000
   npm run dev:frontend # Frontend on http://localhost:3000
   ```

### Database Setup

```sql
-- Create database
CREATE DATABASE vevurn_pos;

-- Create user (optional)
CREATE USER vevurn_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vevurn_pos TO vevurn_user;
```

## 📝 API Documentation

### Authentication

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt_token_here",
    "expiresIn": "24h"
  }
}
```

### Products

#### GET /api/products
Get all products with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search query
- `category`: Filter by category ID
- `brand`: Filter by brand ID
- `lowStock`: Filter low stock items (boolean)

#### POST /api/products
Create a new product.

**Request Body:**
```json
{
  "name": "iPhone 15 Case",
  "description": "Premium protective case",
  "sku": "IP15-CASE-001",
  "categoryId": "cat_id",
  "brandId": "brand_id",
  "unitPrice": 15000,
  "costPrice": 8000,
  "minStock": 5,
  "reorderLevel": 10
}
```

### Sales

#### POST /api/sales
Create a new sale.

**Request Body:**
```json
{
  "customerId": "optional_customer_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "unitPrice": 15000,
      "discount": 0
    }
  ],
  "paymentMethod": "MOMO_MTN",
  "momoPhone": "+250781234567",
  "discountAmount": 0,
  "notes": "Sale notes"
}
```

## 🔐 User Roles

1. **Super Admin**: Full system access, user management, settings
2. **Admin**: User management, reports, inventory management
3. **Manager**: Sales oversight, inventory management, basic reports
4. **Cashier**: Sales processing, customer management, basic inventory view

## 🌍 Mobile Money Integration

### MTN Mobile Money (Rwanda)

The system integrates with MTN Mobile Money API for seamless payments:

1. **Collection**: Request payment from customer's mobile money account
2. **Status Checking**: Real-time payment status verification
3. **Reconciliation**: Automatic payment confirmation and receipt generation

### Setup Requirements

1. MTN Mobile Money Developer Account
2. Collection API credentials
3. Sandbox/Production environment configuration

## 📊 Reporting Features

- **Daily Sales Report**: Sales summary, top products, payment methods
- **Inventory Report**: Stock levels, low stock alerts, reorder recommendations
- **Customer Report**: Customer activity, loyalty points, purchase history
- **Financial Report**: Revenue tracking, profit margins, expense tracking

## 🔧 Configuration

### System Settings

Access via `/api/settings` endpoint:

- `business_name`: Your business name
- `business_address`: Business address
- `business_phone`: Contact phone number
- `currency`: Default currency (RWF)
- `tax_rate`: Tax percentage
- `low_stock_threshold`: Global low stock threshold
- `receipt_footer`: Custom receipt footer text

## 🚀 Deployment

### Production Build

```bash
# Build all workspaces
npm run build

# Or build separately
npm run build:backend
npm run build:frontend
```

### Environment Variables (Production)

```bash
# Backend
NODE_ENV=production
DATABASE_URL=your_production_db_url
JWT_SECRET=your_super_secure_jwt_secret
MTN_MOMO_BASE_URL=https://momodeveloper.mtn.com
# ... other production variables

# Frontend
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_NAME="Vevurn POS"
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](./docs/) directory:

- **[📋 Complete Documentation Index](./docs/README.md)** - Start here for all documentation
- **[🏗️ Project Architecture](./docs/architecture/PROJECT_INTELLIGENCE.md)** - System design and architecture
- **[🚀 Development Setup](./docs/setup/DEVELOPMENT.md)** - Environment setup and guidelines
- **[🔧 Backend Documentation](./docs/backend/)** - API, middleware, and service documentation
- **[🎨 Frontend Documentation](./docs/frontend/)** - UI components and configuration guides

### Quick Links
- [API Routes Documentation](./docs/backend/API_ROUTES_DOCUMENTATION.md)
- [Authentication Guide](./docs/backend/BETTER_AUTH_README.md)
- [Payment Services](./docs/backend/PAYMENT_SERVICES_DOCUMENTATION.md)
- [Frontend Setup](./docs/frontend/frontend-readme.md)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific workspace
npm run test:frontend
npm run test:backend

# Run with coverage
npm run test:coverage
```

## 📝 Scripts

- `npm run dev`: Start development servers
- `npm run build`: Build all workspaces
- `npm run test`: Run all tests
- `npm run lint`: Lint all workspaces
- `npm run type-check`: TypeScript type checking
- `npm run db:generate`: Generate Prisma client
- `npm run db:migrate`: Run database migrations
- `npm run db:seed`: Seed database with sample data
- `npm run db:studio`: Open Prisma Studio
- `npm run clean`: Clean build artifacts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Shima Serein**
- GitHub: [@supserrr](https://github.com/supserrr)

## 🙏 Acknowledgments

- MTN Mobile Money API for payment integration
- Prisma for excellent database tooling
- Next.js team for the amazing framework
- All contributors to the open-source libraries used

---

**Made with ❤️ in Rwanda for Rwandan businesses**
