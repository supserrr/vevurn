# Vevurn POS - Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 22.16.0 (use `nvm` to install)
- PostgreSQL database
- Git

### Setup
1. **Clone and Install**
   ```bash
   git clone <repository>
   cd vevurn-pos
   npm run setup
   ```

2. **Configure Environment**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database URL and other settings

   # Frontend environment  
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local with API URLs
   ```

3. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000

## 🏗️ System Architecture

### Backend (Express.js + Prisma)
- **Authentication**: Better Auth with role-based access
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for notifications
- **Email**: Nodemailer for cashier credentials
- **File Upload**: AWS S3 integration

### Frontend (Next.js 15)
- **Framework**: Next.js with App Router
- **UI**: shadcn/ui components with Tailwind CSS
- **State**: React Query for server state
- **Real-time**: Socket.io client for notifications

## 📱 User Flows

### 1. Business Onboarding
1. Manager signs up → `/onboarding`
2. Completes business setup (name, logo, TIN)
3. Redirected to management dashboard

### 2. Cashier Management
1. Manager creates cashier account
2. Cashier receives email with credentials
3. Cashier logs in, changes password
4. Access POS interface only

### 3. POS Operations
1. Cashier scans/selects products
2. Adds to cart with quantity
3. Processes payment (cash/mobile money)
4. Inventory automatically updated
5. Real-time notifications sent

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get session
- `POST /api/auth/create-cashier` - Create cashier (Manager only)

### Business Management
- `POST /api/business/setup` - Complete onboarding
- `GET /api/business` - Get business details
- `PUT /api/business` - Update business

### Products & Inventory
- `GET /api/products` - List products
- `POST /api/products` - Create product (Manager only)
- `PUT /api/products/:id` - Update product (Manager only)
- `PUT /api/products/:id/stock` - Update stock levels

### Sales & POS
- `POST /api/sales` - Process sale
- `GET /api/sales` - List sales
- `GET /api/sales/:id` - Get sale details

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all read

## 🧪 Testing

```bash
# Run system tests
npm run test

# Test individual components
cd backend && npm test
cd frontend && npm test
```

## 🚀 Deployment

### Backend (Render)
1. Connect GitHub repository
2. Set environment variables
3. Deploy with build command: `npm run build`

### Frontend (Vercel)
1. Connect GitHub repository  
2. Set environment variables
3. Deploy automatically on push

### Database (Render PostgreSQL)
1. Create PostgreSQL instance
2. Update DATABASE_URL in backend .env
3. Run migrations: `npx prisma migrate deploy`

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-key
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

## 📞 Support

For development questions:
1. Check this README
2. Review API documentation
3. Check error logs in console
4. Test with provided scripts
