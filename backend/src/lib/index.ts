/**
 * Backend Auth Export File
 * 
 * This file provides organized exports for all authentication functionality
 * in the Vevurn POS backend system.
 */

// Main Better Auth instance
export { auth } from './auth';

// Type definitions
export {
  type Session,
  type User,
  type VevurnUser,
  type VevurnSession,
  type UserRole,
  type UserPermissions,
  type UserAccount,
  type UserFilters,
  type UserStats,
  type EmailChangeRequest,
  type AccountDeletionRequest,
  type SessionInfo,
  type AuthError,
  type POSAuthContext,
  type EmployeeLookup,
  type BulkUserOperation,
  type CreateUserData,
  type UpdateUserData,
  isValidUserRole,
  isVevurnUser,
  isVevurnSession,
} from './auth-types';

// User service functions
export {
  getUserById,
  getUsersByRole,
  getUserStats,
  updateUser,
  getUsers,
  getUserByEmployeeId,
} from './user-service';

// Database and storage services
export { redisStorage } from './redis-storage';
export { databaseHooks } from './database-hooks';

// Email service
export {
  sendEmail,
  createVerificationEmailTemplate,
  createPasswordResetEmailTemplate,
  createWelcomeEmailTemplate,
} from './email-service';
