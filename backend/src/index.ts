import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Import Better Auth
import { auth } from './lib/index.js';
import { toNodeHandler } from 'better-auth/node';

// Import route handlers (ALL UPDATED FOR BETTER AUTH)
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import saleRoutes from './routes/sales';
import customerRoutes from './routes/customers';
import supplierRoutes from './routes/suppliers';
import loanRoutes from './routes/loans';
import reportRoutes from './routes/reports';
import settingRoutes from './routes/settings';
import pricingRoutes from './routes/pricing.routes';
import mobileMoneyRoutes from './routes/mobileMoneyRoutes'; // NEW

// Import services
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { WebSocketService } from './services/WebSocketService';

// Create Express app
const app = express();
const server = createServer(app);

// Initialize services
const databaseService = new DatabaseService();
const redisService = new RedisService();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});
const webSocketService = new WebSocketService(io);

// Make services available globally
(global as any).webSocketService = webSocketService;
(global as any).redisService = redisService;

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Health check endpoints
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'vevurn-pos-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'vevurn-pos-api',
    timestamp: new Date().toISOString(),
  });
});

// Better Auth handler
app.all('/api/auth/*', toNodeHandler(auth));

// API routes (ALL UPDATED FOR BETTER AUTH - middleware will be applied in route files)
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/mobile-money', mobileMoneyRoutes); // NEW

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handler (LAST)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, starting graceful shutdown`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await databaseService.disconnect();
      await redisService.disconnect();
      console.log('Database and Redis connections closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Vevurn POS Backend running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔐 Better Auth: http://${HOST}:${PORT}/api/auth`);
  console.log(`📱 Mobile Money: http://${HOST}:${PORT}/api/mobile-money`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
