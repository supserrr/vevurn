/**
 * Backend Middleware Export File - Better Auth Only
 * 
 * This file provides organized exports for all middleware functionality
 * in the Vevurn POS backend system using Better Auth exclusively.
 */

// Better Auth middleware (primary authentication system)
export {
  attachBetterAuthSession,
  requireBetterAuth,
  requireRole,
  getCurrentUser,
  getCurrentSession,
} from './betterAuth';

// Core middleware
export { errorHandler } from './errorHandler';
export { rateLimiter } from './rateLimiter';
export { requestLogger } from './requestLogger';
export { roleMiddleware } from './roleMiddleware';
export { setupErrorTracking } from './errorTracking';

// Rate limiting
export { default as rateLimitHandler } from './rate-limit-handler';
