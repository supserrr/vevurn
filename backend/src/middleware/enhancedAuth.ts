/**
 * Enhanced Auth Middleware - Compatibility layer for Better Auth
 * 
 * This file provides backward compatibility for enhanced auth imports
 */

import { requireBetterAuth, requireRole } from './betterAuth.js';
import type { AuthenticatedRequest } from './auth.js';

// Enhanced auth middleware - same as regular auth for now
export const enhancedAuthMiddleware = requireBetterAuth;

// Authorization function
export const enhancedAuthorize = (roles: string[]) => {
  return requireRole(roles);
};

// Admin only middleware
export const adminOnly = requireRole(['admin']);

// Manager or above middleware  
export const managerOrAbove = requireRole(['admin', 'manager']);

// Enhanced auth middleware class for compatibility
export class EnhancedAuthMiddleware {
  static requireAuth = requireBetterAuth;
  static requireRole = requireRole;
}

// Export types
export type { AuthenticatedRequest };
