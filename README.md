# Vevurn POS System

<div align="center">
  <h1>🏪 Vevurn Point of Sale System</h1>
  <p>Enterprise-grade POS system built with modern web technologies</p>
  
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
</div>

## 🚀 Features

### 💰 Sales Management
- **Real-time Sales Processing** - Fast and efficient checkout system
- **Multiple Payment Methods** - Cash, card, and digital payment support
- **Receipt Generation** - Automatic receipt printing and digital copies
- **Sales Analytics** - Comprehensive sales reporting and insights

### 📦 Inventory Management
- **Product Catalog** - Complete product management with categories
- **Stock Tracking** - Real-time inventory levels and alerts
- **Supplier Management** - Vendor relationships and purchase orders
- **Barcode Support** - Product scanning and barcode generation

### 👥 Customer Management
- **Customer Profiles** - Detailed customer information and history
- **Loyalty Programs** - Points and rewards management
- **Purchase History** - Complete transaction history per customer
- **Customer Analytics** - Insights into customer behavior

### 💳 Financial Management
- **Loan Management** - Customer credit and payment tracking
- **Financial Reporting** - Daily, weekly, monthly reports
- **Tax Management** - Automated tax calculations and reporting
- **Expense Tracking** - Business expense management

### 👨‍💼 Staff Management
- **Role-based Access Control** - Secure permission system
- **Staff Performance** - Sales tracking per employee
- **Shift Management** - Clock in/out and schedule management
- **Activity Logging** - Complete audit trail

## 🏗️ Architecture

This is a modern monorepo built with:

```
vevurn/
├── 📦 shared/          # Shared types, utilities, and constants
├── 🖥️  backend/         # Express.js API server
├── 🌐 frontend/        # Next.js web application
├── 🗄️  database/        # Database schemas and migrations
├── 📚 docs/            # Documentation
└── 🔧 .github/         # CI/CD workflows
```

### Backend Stack
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session and data caching
- **Authentication**: JWT-based authentication
- **Real-time**: WebSocket support for live updates
- **Security**: Helmet, CORS, rate limiting

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with Shadcn/ui components
- **State Management**: Zustand for global state
- **API Communication**: React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics visualization

## 🛠️ Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- pnpm (v8 or higher)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/supserrr/vevurn.git
cd vevurn
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the .env files with your database and Redis credentials
```

4. **Set up the database**
```bash
# Run database migrations
pnpm db:migrate

# Seed initial data (optional)
pnpm db:seed
```

5. **Start development servers**
```bash
# Start all services
pnpm dev

# Or start individually
pnpm backend:dev    # Backend API (http://localhost:8000)
pnpm frontend:dev   # Frontend App (http://localhost:3000)
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm backend:test
pnpm frontend:test
pnpm shared:test

# Run tests with coverage
pnpm test:coverage
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
pnpm docker:up

# For production
pnpm deploy:prod
```

### Environment-specific Deployments
```bash
# Staging deployment
pnpm deploy:staging

# Production deployment
pnpm deploy:prod
```

## 📋 API Documentation

The API documentation is available at:
- **Development**: http://localhost:8000/api/docs
- **Swagger UI**: http://localhost:8000/api-docs

### Main Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/products` - Product catalog
- `POST /api/sales` - Process sales
- `GET /api/reports` - Generate reports
- `GET /api/customers` - Customer management

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@vevurn.com
- 💬 Discord: [Join our server](https://discord.gg/vevurn)
- 📖 Documentation: [docs.vevurn.com](https://docs.vevurn.com)
- 🐛 Issues: [GitHub Issues](https://github.com/supserrr/vevurn/issues)

## 🙏 Acknowledgments

- Built with ❤️ by the Vevurn development team
- Thanks to all contributors and the open-source community
- Special thanks to the creators of the amazing tools we use

---

<div align="center">
  <p>Made with ❤️ for retail businesses worldwide</p>
</div>