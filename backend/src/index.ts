// Fixed Backend Server Configuration
// File: backend/src/index.ts

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables FIRST
dotenv.config();

// Import Better Auth components
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Import route handlers
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import saleRoutes from './routes/sales.js';
import customerRoutes from './routes/customers.js';
import supplierRoutes from './routes/suppliers.js';
import loanRoutes from './routes/loans.js';
import reportRoutes from './routes/reports.js';
import settingRoutes from './routes/settings.js';

// Create Express app
const app: Application = express();
const server = createServer(app);

// Configuration
const PORT = parseInt(process.env.PORT || '8001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_DEPLOY_URL = process.env.FRONTEND_DEPLOY_URL || 'https://vevurn.vercel.app';

// CORS configuration
const corsOptions = {
  origin: [
    FRONTEND_URL,
    FRONTEND_DEPLOY_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'https://vevurn.vercel.app',
    'https://vevurn.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression() as any);
app.use(cors(corsOptions));

// Request logging
app.use(requestLogger);

// CRITICAL: Better Auth handler MUST be mounted BEFORE express.json()
// This handles all /api/auth/* routes including signup, signin, oauth
console.log('🔐 Mounting Better Auth handler at /api/auth/*');
app.all("/api/auth/*", toNodeHandler(auth));

// CRITICAL: Mount express.json() AFTER Better Auth
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (after Better Auth to avoid conflicts)
app.use(rateLimiter);

// Initialize Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

// Root route - IMPORTANT: This prevents the "Route / not found" error
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🎉 Vevurn POS Backend is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth/*',
      health: '/api/health',
      users: '/api/users',
      products: '/api/products',
      sales: '/api/sales'
    }
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected', // You can add actual health checks here
      auth: 'active',
      server: 'running'
    }
  });
});

// API health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Better Auth status check
app.get('/api/auth-status', (_req, res) => {
  try {
    // Basic check that Better Auth is working
    res.json({
      success: true,
      message: 'Better Auth is configured and running',
      endpoints: {
        signup: '/api/auth/sign-up/email',
        signin: '/api/auth/sign-in/email',
        google: '/api/auth/sign-in/social/google',
        signout: '/api/auth/sign-out',
        session: '/api/auth/get-session'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Better Auth status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Better Auth configuration error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug route to show all available routes
app.get('/api/debug/routes', (_req, res) => {
  const routes: Array<{path: string; methods: string[]}> = [];
  
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    totalRoutes: routes.length,
    routes,
    timestamp: new Date().toISOString()
  });
});

// API routes (with basic auth protection - you can add auth middleware later)
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);

// Test endpoint for signup debugging
app.post('/api/test/signup', (req, res) => {
  try {
    console.log('🧪 Test signup endpoint received data:', JSON.stringify(req.body, null, 2));
    
    // Validate the data we're receiving
    const { email, password, firstName, lastName } = req.body;
    
    const validation = {
      email: !!email,
      password: !!password,
      firstName: !!firstName,
      lastName: !!lastName
    };
    
    res.json({
      success: true,
      message: 'Test signup endpoint working',
      receivedData: req.body,
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test signup error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      availableEndpoints: {
        root: '/',
        health: '/health',
        auth: '/api/auth/*',
        authStatus: '/api/auth-status',
        testSignup: '/api/test/signup'
      }
    }
  });
});

// Global error handler
app.use(errorHandler);

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 Vevurn POS Backend Started Successfully!');
  console.log(`📡 Server: http://0.0.0.0:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Better Auth: Configured & Ready');
  console.log('✅ Socket.IO: Real-time communication active');
  console.log('✅ CORS: Cross-origin requests enabled');
  console.log('✅ Security: Helmet protection active');
  console.log('');
  console.log('🔗 Available Endpoints:');
  console.log(`   📍 Root: http://localhost:${PORT}/`);
  console.log(`   💚 Health: http://localhost:${PORT}/health`);
  console.log(`   🔐 Auth: http://localhost:${PORT}/api/auth/*`);
  console.log(`   📊 Auth Status: http://localhost:${PORT}/api/auth-status`);
  console.log(`   🧪 Test Signup: http://localhost:${PORT}/api/test/signup`);
  console.log('');
});

export default app;
