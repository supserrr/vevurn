# ⚡ Quick Reference

Fast access to the most commonly needed documentation.

## 🚀 First Time Setup
```bash
# 1. Clone & Install
git clone https://github.com/supserrr/vevurn.git
cd vevurn && pnpm install

# 2. Setup Environment  
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL

# 3. Database Setup
pnpm run db:generate && pnpm run db:migrate

# 4. Start Development
pnpm run dev
```
**Full Guide**: [Development Setup](./setup/DEVELOPMENT.md)

## 🔌 API Quick Reference

### Authentication
```bash
POST /api/auth/login     # Login user
POST /api/auth/register  # Register user
POST /api/auth/logout    # Logout user
GET  /api/auth/me        # Get current user
```

### Products  
```bash
GET    /api/products        # List products
POST   /api/products        # Create product
GET    /api/products/:id    # Get product
PUT    /api/products/:id    # Update product
DELETE /api/products/:id    # Delete product
```

### Sales
```bash
GET  /api/sales           # List sales
POST /api/sales           # Create sale
GET  /api/sales/:id       # Get sale details
```

**Full Guide**: [API Routes Documentation](./backend/API_ROUTES_DOCUMENTATION.md)

## 💳 Payment Integration

### MTN Mobile Money
```javascript
// Example payment request
const payment = await momoService.requestPayment({
  amount: 15000,
  phoneNumber: '250788123456',
  reference: 'SALE_12345'
});
```

**Full Guide**: [Payment Services](./backend/PAYMENT_SERVICES_DOCUMENTATION.md)

## 🛠️ Common Commands

```bash
# Development
pnpm run dev              # Start all servers
pnpm run dev:frontend     # Frontend only  
pnpm run dev:backend      # Backend only

# Database
pnpm run db:studio        # Open Prisma Studio
pnpm run db:migrate       # Run migrations
pnpm run db:seed          # Seed data

# Build & Deploy
pnpm run build            # Build all
pnpm run start            # Start production

# Testing & Quality
pnpm run test             # Run tests
pnpm run lint             # Lint code
pnpm run type-check       # TypeScript check
```

## 🐛 Quick Troubleshooting

| Problem | Solution | Reference |
|---------|----------|-----------|
| Port already in use | `lsof -ti :3000 \| xargs kill -9` | [Setup Guide](./setup/DEVELOPMENT.md) |
| Prisma client errors | `pnpm run db:generate` | [Backend Docs](./backend/COMPLETE_IMPLEMENTATION_SUMMARY.md) |
| Auth not working | Check JWT_SECRET in .env | [Auth Guide](./backend/BETTER_AUTH_README.md) |
| Import errors | Check path mappings | [Import Fixes](./backend/IMPORT_ERRORS_FIXED.md) |
| TypeScript errors | `pnpm run type-check` | [Frontend Guide](./frontend/typescript-config.md) |

## 📁 Project Structure
```
vevurn/
├── frontend/           # Next.js 15 + React 19
├── backend/            # Node.js + Express + Prisma
├── shared/             # Common types & utilities  
├── docs/               # 📚 All documentation
└── README.md           # Project overview
```

## 🔗 Essential Links

- 📋 [Complete Documentation](./README.md)
- 🏗️ [System Architecture](./architecture/PROJECT_INTELLIGENCE.md) 
- 🚀 [Development Guide](./setup/DEVELOPMENT.md)
- 🔌 [API Reference](./backend/API_ROUTES_DOCUMENTATION.md)
- 🎨 [Frontend Guide](./frontend/frontend-readme.md)

---
**💡 Bookmark this page** for quick access to the most important information!
