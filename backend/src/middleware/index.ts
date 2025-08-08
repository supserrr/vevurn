/**
 * Backend Middleware Export File
 * 
 * This file provides organized exports for all middleware functionality
 * in the Vevurn POS backend system.
 */

// Better Auth middleware (recommended for new implementations)
export {
  attachBetterAuthSession,
  requireBetterAuth,
  requireRole,
  getCurrentUser,
  getCurrentSession,
} from './betterAuth';

// Legacy auth middleware (for compatibility)
export { authMiddleware } from './auth';

// Enhanced auth middleware
export { enhancedAuthMiddleware } from './enhancedAuthMiddleware';

// Error handling
export { errorHandler } from './errorHandler';
export { enhancedErrorHandler } from './enhancedErrorHandler';
export { setupErrorTracking } from './errorTracking';

// Rate limiting
export { rateLimiter } from './rateLimiter';

// Request logging
export { requestLogger } from './requestLogger';

// Role-based middleware
export { roleMiddleware } from './roleMiddleware';
