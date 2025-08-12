/**
 * Main Auth Export File
 * 
 * This file provides a single entry point for all authentication functionality
 * in the Vevurn POS system using Better Auth only.
 */

// Core Better Auth client and functions
export {
  authClient,
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
  getErrorMessage,
} from './auth-client';

// Type definitions
export type { User, Session } from './auth-client';

// API Client
export { apiClient } from './api-client';
