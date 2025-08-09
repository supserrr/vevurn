/**
 * Auth Middleware - Compatibility layer for Better Auth
 * 
 * This file provides backward compatibility for legacy auth imports
 */

import { requireBetterAuth } from './betterAuth.js';

// Extended Request interface for authenticated requests  
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    [key: string]: any;
  };
  session?: any;
  betterAuth?: {
    session: any;
    user: any;
  };
}

// Legacy auth middleware - delegates to better-auth
export const authMiddleware = requireBetterAuth;
