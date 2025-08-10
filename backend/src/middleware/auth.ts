/**
 * Auth Middleware - Compatibility layer for Better Auth
 * 
 * This file provides backward compatibility for legacy auth imports
 */

import { requireBetterAuth } from './betterAuth.js';
import { Request } from 'express';

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
  // Explicitly ensure Express properties are available
  body: any;
  params: any;
  query: any;
  headers: any;
  files?: any;
  file?: any;
}

// Legacy auth middleware - delegates to better-auth
export const authMiddleware = requireBetterAuth;
