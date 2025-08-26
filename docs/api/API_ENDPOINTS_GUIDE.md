# 🚀 API ENDPOINT CONFIGURATION GUIDE

## 📍 PRODUCTION API ENDPOINTS

This document outlines the complete API endpoint configuration for Vevurn POS production deployment.

---

## 🔧 BACKEND API CONFIGURATION

### **Base URL**
```
Production: http://localhost:5000
Development: http://localhost:5000
```

### **Authentication Endpoints (Better Auth)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Email/password signup |
| POST | `/api/auth/sign-in/email` | Email/password login |
| POST | `/api/auth/sign-out` | Logout user |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/verify-email` | Email verification |
| POST | `/api/auth/sign-in/google` | Google OAuth login |
| POST | `/api/auth/sign-up/google` | Google OAuth signup |

### **Product Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/search` | Search products |
| GET | `/api/products/categories` | List categories |

### **Customer Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| GET | `/api/customers/:id` | Get single customer |
| POST | `/api/customers` | Create new customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/customers/search` | Search customers |

### **Sales Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List all sales |
| GET | `/api/sales/:id` | Get single sale |
| POST | `/api/sales` | Create new sale |
| PUT | `/api/sales/:id` | Update sale |
| DELETE | `/api/sales/:id` | Delete sale |
| GET | `/api/sales/reports` | Sales reports |

### **Analytics & Dashboard**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Business analytics |
| GET | `/api/dashboard/metrics` | Dashboard metrics |
| GET | `/api/reports/daily` | Daily reports |
| GET | `/api/reports/monthly` | Monthly reports |
| GET | `/api/reports/yearly` | Yearly reports |

### **Inventory Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/movements` | Stock movements |
| POST | `/api/inventory/adjust` | Adjust stock |
| GET | `/api/inventory/alerts` | Low stock alerts |

### **Payment Processing**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/momo` | MTN Mobile Money |
| POST | `/api/payments/cash` | Cash payment |
| POST | `/api/payments/card` | Card payment |
| GET | `/api/payments/:id/status` | Payment status |

---

## 🌐 FRONTEND API CLIENT CONFIGURATION

### **API Client Setup**
```typescript
// frontend/apps/web/lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For Better Auth cookies
});
```

### **Environment Variables**
```env
# frontend/apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production:
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **API Service Functions**
```typescript
// Products
export const productService = {
  getAll: () => apiClient.get('/api/products'),
  getById: (id: string) => apiClient.get(`/api/products/${id}`),
  create: (data: any) => apiClient.post('/api/products', data),
  update: (id: string, data: any) => apiClient.put(`/api/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/products/${id}`),
};

// Customers  
export const customerService = {
  getAll: () => apiClient.get('/api/customers'),
  getById: (id: string) => apiClient.get(`/api/customers/${id}`),
  create: (data: any) => apiClient.post('/api/customers', data),
  update: (id: string, data: any) => apiClient.put(`/api/customers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/customers/${id}`),
};

// Sales
export const saleService = {
  getAll: () => apiClient.get('/api/sales'),
  getById: (id: string) => apiClient.get(`/api/sales/${id}`),
  create: (data: any) => apiClient.post('/api/sales', data),
  update: (id: string, data: any) => apiClient.put(`/api/sales/${id}`, data),
};
```

---

## 🔐 AUTHENTICATION INTEGRATION

### **Better Auth Client**
```typescript
// frontend/apps/web/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  credentials: "include",
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

### **Authentication Usage**
```typescript
// In React components
import { useSession, signIn, signOut } from '@/lib/auth-client';

export function LoginComponent() {
  const { data: session, isPending } = useSession();
  
  const handleLogin = async (email: string, password: string) => {
    await signIn.email({ email, password });
  };
  
  const handleGoogleLogin = async () => {
    await signIn.social({ provider: 'google' });
  };
}
```

---

## 📊 API RESPONSE FORMATS

### **Success Response**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

### **Paginated Response**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

## 🛡️ CORS CONFIGURATION

### **Backend CORS Setup**
```typescript
// backend/src/middlewares/cors.middleware.ts
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};
```

### **Environment Variables**
```env
# Development
CORS_ORIGINS=http://localhost:3000

# Production  
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## 🚀 DEPLOYMENT CONFIGURATION

### **Production Environment**
```env
# Backend production environment
DATABASE_URL=postgresql://user:pass@host:port/database
BETTER_AUTH_SECRET=your-production-secret
BETTER_AUTH_URL=https://api.yourdomain.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CORS_ORIGINS=https://yourdomain.com
NODE_ENV=production
```

### **Frontend Production Build**
```env
# Frontend production environment
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🧪 TESTING API ENDPOINTS

### **Health Check**
```bash
curl http://localhost:5000/health
```

### **Authentication Test**
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### **API Endpoints Test**
```bash
# Get products (requires authentication)
curl http://localhost:5000/api/products \
  -H "Cookie: better-auth.session_token=your-session-token"

# Create product (requires authentication)
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-session-token" \
  -d '{"name":"Test Product","price":"10000","sku":"TEST001"}'
```

---

## 📋 PRODUCTION CHECKLIST

### **Backend API**
- [ ] All endpoints tested and functional
- [ ] Authentication properly configured
- [ ] CORS set for production domains
- [ ] Database connection established
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Logging configured

### **Frontend Integration**
- [ ] API client configured for production URL
- [ ] Better Auth client configured
- [ ] Environment variables set
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Production build tested

### **Security**
- [ ] HTTPS enabled
- [ ] Secure cookies configured
- [ ] CORS properly restricted
- [ ] Authentication tokens secure
- [ ] Input validation enabled
- [ ] SQL injection protection
- [ ] XSS protection enabled

---

**📝 Last Updated:** August 25, 2025  
**🎯 Status:** Production Ready  
**🔗 Repository:** https://github.com/supserrr/vevurn.git
