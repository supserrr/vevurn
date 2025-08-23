// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { auth } from './auth';
import { toNodeHandler } from 'better-auth/node';
import { errorMiddleware } from './middlewares/error.middleware';
import { corsMiddleware } from './middlewares/cors.middleware';
import { rateLimitMiddleware } from './middlewares/rate-limit.middleware';
import { auditMiddleware } from './middlewares/audit.middleware';
import routes from './routes';
import { logger } from './utils/logger';

const app: express.Application = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Basic security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(corsMiddleware);

// Rate limiting
app.use(rateLimitMiddleware);

// ==========================================
// LOGGING & MONITORING
// ==========================================

// HTTP request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// ==========================================
// BODY PARSING
// ==========================================

// Compression
app.use(compression());

// JSON parsing with size limits
app.use('/api', express.json({ 
  limit: '10mb',
  strict: true,
}));

// URL encoded parsing
app.use('/api', express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// ==========================================
// BETTER AUTH HANDLER
// ==========================================

// Mount Better Auth handler
app.all('/api/auth/*', toNodeHandler(auth));

// ==========================================
// AUDIT LOGGING
// ==========================================

// Audit middleware (after auth routes to avoid logging auth requests)
app.use('/api', auditMiddleware);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Vevurn POS API',
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Vevurn POS API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ==========================================
// API ROUTES
// ==========================================

app.use('/api', routes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use(errorMiddleware);

export { app };
export default app;
