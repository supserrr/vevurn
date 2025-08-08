/**
 * Main Auth Export File
 * 
 * This file provides a single entry point for all authentication functionality
 * in the Vevurn POS system. Import everything you need from here.
 */

// Core auth client and functions
export {
  authClient,
  client,
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
  changePassword,
  resetPassword,
} from './auth';

// Type definitions
export type { VevurnUser, VevurnSession, User, Session } from './auth';

// React hooks and components
export {
  useVevurnAuth,
  useRequireAuth,
  useRequireRole,
  useDiscountPermission,
  useBelowMinimumPermission,
  useAuthActions,
  ProtectedRoute,
  UserProfile,
} from './auth-hooks';
