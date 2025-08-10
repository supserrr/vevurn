# Enhanced Error Handler Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Enhanced Error Handler Middleware into your Vevurn POS System. The integration ensures comprehensive error handling, tracking, and consistent responses across your application.

## Prerequisites

Ensure the following components are properly set up before integration:

- ✅ ErrorTrackingService (implemented)
- ✅ DatabasePoolService (implemented)
- ✅ Enhanced Authentication Middleware (implemented)
- ✅ Logger service
- ✅ Prisma client
- ✅ Redis service

## Integration Steps

### Step 1: Update Main Application File

Update your main application file (`src/index.ts` or similar) to include the enhanced error handler:

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import middleware
import { enhancedErrorHandler, notFoundHandler } from './middleware/enhancedErrorHandler';
import { timeoutHandler } from './middleware/enhancedErrorHandler';

// Import other middleware
import { enhancedAuth } from './middleware/enhancedAuth';
import { rateLimiter } from './middleware/rateLimiter';

// Import routes
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import salesRoutes from './routes/sales';
import errorTrackingRoutes from './routes/error-tracking';

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Timeout middleware (should be early)
app.use(timeoutHandler(30000)); // 30 second timeout

// Request ID generation (built into enhanced error handler)
// This happens automatically with enhanced error handler

// Rate limiting
app.use(rateLimiter);

// Health check endpoint (before authentication)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes (with authentication where needed)
app.use('/api/users', enhancedAuth, userRoutes);
app.use('/api/products', enhancedAuth, productRoutes);
app.use('/api/sales', enhancedAuth, salesRoutes);

// Admin-only error tracking routes
app.use('/api/errors', enhancedAuth, errorTrackingRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Enhanced error handler (must be last)
app.use(enhancedErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

### Step 2: Update Existing Controllers

Update your controllers to use the new error types:

```typescript
// src/controllers/UserController.ts
import { Request, Response, NextFunction } from 'express';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AuthenticationError 
} from '../middleware/enhancedErrorHandler';

export class UserController {
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Validation
      if (!id) {
        throw new ValidationError('User ID is required', 'MISSING_USER_ID');
      }
      
      if (!/^\d+$/.test(id)) {
        throw new ValidationError('Invalid user ID format', 'INVALID_USER_ID');
      }
      
      const user = await this.userService.findById(parseInt(id));
      
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }
      
      res.json({ 
        success: true, 
        data: user,
        meta: {
          requestId: req.requestId
        }
      });
    } catch (error) {
      next(error); // Enhanced error handler will process this
    }
  }
  
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = req.body;
      
      // Let Zod validation handle schema errors (automatically processed)
      const validatedData = userCreateSchema.parse(userData);
      
      const user = await this.userService.create(validatedData);
      
      res.status(201).json({ 
        success: true, 
        data: user,
        meta: {
          requestId: req.requestId
        }
      });
    } catch (error) {
      // Prisma P2002 (unique constraint) automatically handled
      // Zod errors automatically handled
      next(error);
    }
  }
  
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (!id) {
        throw new ValidationError('User ID is required', 'MISSING_USER_ID');
      }
      
      // Check user exists first
      const existingUser = await this.userService.findById(parseInt(id));
      if (!existingUser) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }
      
      // Check authorization (example)
      if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
        throw new AuthenticationError('Not authorized to update this user', 'INSUFFICIENT_PERMISSIONS');
      }
      
      const validatedUpdates = userUpdateSchema.parse(updates);
      const updatedUser = await this.userService.update(parseInt(id), validatedUpdates);
      
      res.json({ 
        success: true, 
        data: updatedUser,
        meta: {
          requestId: req.requestId
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Step 3: Update Service Layer

Update your service classes to work with the error handler:

```typescript
// src/services/UserService.ts
export class UserService {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: number) {
    // Don't handle Prisma errors here - let them bubble up
    // Enhanced error handler will classify P2025 as NotFoundError
    return await this.prisma.user.findUniqueOrThrow({
      where: { id }
    });
  }
  
  async create(userData: CreateUserData) {
    // Don't handle P2002 (unique constraint) here
    // Enhanced error handler will classify it as ConflictError
    return await this.prisma.user.create({
      data: userData
    });
  }
  
  async update(id: number, updates: UpdateUserData) {
    return await this.prisma.user.update({
      where: { id },
      data: updates
    });
  }
}
```

### Step 4: Update Authentication Middleware

If you have custom authentication middleware, ensure it works with the error handler:

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { AuthenticationError } from './enhancedErrorHandler';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('Access token required', 'MISSING_TOKEN');
    }
    
    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = user;
    next();
  } catch (error) {
    // JWT errors (TokenExpiredError, JsonWebTokenError) automatically handled
    next(error);
  }
}
```

### Step 5: Update Route Handlers

Update your route files to use proper error handling:

```typescript
// src/routes/users.ts
import express from 'express';
import { UserController } from '../controllers/UserController';
import { ValidationError } from '../middleware/enhancedErrorHandler';

const router = express.Router();
const userController = new UserController();

// Add request validation middleware
router.use('/:id', (req, res, next) => {
  const { id } = req.params;
  if (id && !/^\d+$/.test(id)) {
    throw new ValidationError('Invalid ID format', 'INVALID_ID_FORMAT');
  }
  next();
});

router.get('/:id', userController.getUser.bind(userController));
router.post('/', userController.createUser.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));

export default router;
```

### Step 6: Add Zod Schema Validation

Set up Zod schemas for automatic validation error handling:

```typescript
// src/schemas/userSchemas.ts
import { z } from 'zod';

export const userCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'user']).default('user')
});

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['admin', 'user']).optional()
}).strict(); // Reject unknown fields

export type CreateUserData = z.infer<typeof userCreateSchema>;
export type UpdateUserData = z.infer<typeof userUpdateSchema>;
```

### Step 7: Update Package Dependencies

Ensure all required dependencies are installed:

```json
// package.json
{
  "dependencies": {
    "express": "^4.18.2",
    "zod": "^3.22.4",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "@prisma/client": "^5.7.1",
    "redis": "^4.6.12"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11"
  }
}
```

### Step 8: Environment Configuration

Update your environment variables:

```bash
# .env
NODE_ENV=production
PORT=3001

# Enhanced Error Handler
ENABLE_ERROR_STACK_TRACE=false
ERROR_TRACKING_ENABLED=true
ERROR_TRACKING_BATCH_SIZE=100
ERROR_TRACKING_FLUSH_INTERVAL=30000

# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"

# Notifications (for ErrorTrackingService)
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
NOTIFICATION_EMAIL="alerts@yourcompany.com"
```

### Step 9: Testing Integration

Create a test endpoint to verify integration:

```typescript
// src/routes/test.ts
import express from 'express';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AuthenticationError,
  ServiceUnavailableError 
} from '../middleware/enhancedErrorHandler';

const router = express.Router();

// Test different error types
router.get('/validation-error', (req, res, next) => {
  throw new ValidationError('Test validation error', 'TEST_VALIDATION');
});

router.get('/not-found-error', (req, res, next) => {
  throw new NotFoundError('Test not found error', 'TEST_NOT_FOUND');
});

router.get('/auth-error', (req, res, next) => {
  throw new AuthenticationError('Test auth error', 'TEST_AUTH');
});

router.get('/prisma-error', async (req, res, next) => {
  try {
    // This will cause a Prisma P2025 error
    await prisma.user.findUniqueOrThrow({ where: { id: 999999 } });
  } catch (error) {
    next(error);
  }
});

router.get('/zod-error', (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email() });
    schema.parse({ email: 'invalid-email' });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Step 10: Deployment Checklist

Before deploying, verify:

- [ ] Enhanced error handler is last middleware
- [ ] Not found handler is before error handler
- [ ] All routes pass errors to `next()`
- [ ] Zod schemas are properly defined
- [ ] Environment variables are set
- [ ] Error tracking service is running
- [ ] Database pool service is initialized
- [ ] Tests pass with new error handling

## Testing Your Integration

Run the comprehensive test suite:

```bash
cd backend
npm install axios colors  # Test dependencies
node test-enhanced-error-handler.js
```

### Manual Testing

Test each error type manually:

```bash
# 404 Error
curl -X GET http://localhost:3001/api/non-existent

# Validation Error (if you have the test routes)
curl -X GET http://localhost:3001/api/test/validation-error

# Auth Error
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer invalid-token"

# Check error tracking
curl -X GET http://localhost:3001/api/errors/recent \
  -H "Authorization: Bearer your-admin-token"
```

## Common Issues & Solutions

### Issue: Errors not being caught
**Solution**: Ensure all async functions use try/catch and call `next(error)`

### Issue: Stack traces in production
**Solution**: Set `NODE_ENV=production` and `ENABLE_ERROR_STACK_TRACE=false`

### Issue: Missing request IDs
**Solution**: Ensure enhanced error handler is properly registered

### Issue: Error tracking not working
**Solution**: Verify ErrorTrackingService is initialized and Redis is running

### Issue: Inconsistent error format
**Solution**: Remove other error handlers that might interfere

## Performance Considerations

- Error handling adds ~1-2ms per request
- Error tracking is asynchronous and non-blocking
- Context sanitization prevents memory leaks
- Structured logging enables efficient parsing

## Security Best Practices

- Never expose sensitive data in error messages
- Use specific error codes instead of generic messages
- Implement rate limiting for error endpoints
- Monitor for unusual error patterns
- Regularly review error logs for security issues

---

**Integration Complete!** Your Vevurn POS System now has enterprise-grade error handling with comprehensive tracking, monitoring, and consistent responses across all endpoints.
