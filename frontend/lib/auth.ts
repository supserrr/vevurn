/**
 * Better Auth Client Configuration for Next.js Frontend
 * 
 * This is the main authentication client that communicates with the backend
 * and provides all auth functionality for the Vevurn POS system.
 */

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

// Get backend API URL from environment variables
const backendURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Type definitions for additional user fields (POS-specific)
export interface VevurnUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  firstName: string;
  lastName: string;
  role: 'user' | 'cashier' | 'manager' | 'admin';
  isActive: boolean;
  maxDiscountAllowed: number;
  canSellBelowMin: boolean;
  employeeId?: string | null;
}

export interface VevurnSession {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  user: VevurnUser;
}

// Create Better Auth client for React/Next.js
export const authClient = createAuthClient({
  baseURL: backendURL, // Points to the backend API via proxy
  basePath: "/api/auth", // This will be handled by our Next.js API route
  plugins: [
    inferAdditionalFields<{
      firstName: string;
      lastName: string;
      role: string;
      isActive: boolean;
      maxDiscountAllowed: number;
      canSellBelowMin: boolean;
      employeeId: string | null;
    }>(),
  ],
});

// Export commonly used hooks and functions
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
  changePassword,
  resetPassword,
} = authClient;

// Re-export for compatibility
export { authClient as client };
export type { VevurnUser as User, VevurnSession as Session };
