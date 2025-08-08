/**
 * Better Auth Type Definitions for Vevurn POS
 * 
 * This file provides proper TypeScript integration for Better Auth with
 * additional fields and POS-specific type definitions.
 */

import type { auth } from './auth'

// Infer types from Better Auth configuration
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session['user']

// POS-specific user interface with all additional fields
export interface VevurnUser {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
  // Additional POS fields
  role: string
  employeeId: string | null
  firstName: string
  lastName: string
  isActive: boolean
  maxDiscountAllowed: number
  canSellBelowMin: boolean
}

// Session with user data for POS operations
export interface VevurnSession {
  session: {
    id: string
    userId: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
    createdAt: Date
    updatedAt: Date
  }
  user: VevurnUser
}

// User roles for type safety
export type UserRole = 'admin' | 'manager' | 'cashier' | 'user'

// Permission levels for POS operations
export interface UserPermissions {
  role: UserRole
  maxDiscountAllowed: number
  canSellBelowMin: boolean
  isActive: boolean
}

// Account information for user management
export interface UserAccount {
  id: string
  userId: string
  provider: string
  providerAccountId: string
  type: string
  createdAt: Date
  updatedAt: Date
}

// User management filters and options
export interface UserFilters {
  role?: UserRole
  isActive?: boolean
  searchTerm?: string
  limit?: number
  page?: number
}

// User statistics for admin dashboard
export interface UserStats {
  totalUsers: number
  activeUsers: number
  usersByRole: Record<UserRole, number>
  recentRegistrations: number
}

// Email change request data
export interface EmailChangeRequest {
  currentEmail: string
  newEmail: string
  verificationUrl: string
  token: string
}

// Account deletion request data
export interface AccountDeletionRequest {
  user: VevurnUser
  verificationUrl: string
  token: string
  scheduledAt: Date
}

// Session management data
export interface SessionInfo {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  isActive: boolean
}

// Authentication error types
export type AuthError = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_INACTIVE'
  | 'RATE_LIMITED'
  | 'SESSION_EXPIRED'
  | 'INSUFFICIENT_PERMISSIONS'

// POS-specific authentication context
export interface POSAuthContext {
  user: VevurnUser | null
  session: VevurnSession | null
  permissions: UserPermissions | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
}

// Employee lookup result
export interface EmployeeLookup {
  found: boolean
  user: VevurnUser | null
  permissions: UserPermissions | null
}

// Bulk user operations
export interface BulkUserOperation {
  operation: 'activate' | 'deactivate' | 'updateRole' | 'updatePermissions'
  userIds: string[]
  data?: Partial<VevurnUser>
}

// User creation data (for admin operations)
export interface CreateUserData {
  email: string
  firstName: string
  lastName: string
  employeeId?: string
  role?: UserRole
  maxDiscountAllowed?: number
  canSellBelowMin?: boolean
  sendInvite?: boolean
}

// User update data (for admin operations)
export interface UpdateUserData {
  name?: string
  firstName?: string
  lastName?: string
  employeeId?: string
  role?: UserRole
  isActive?: boolean
  maxDiscountAllowed?: number
  canSellBelowMin?: boolean
}

// Type guards for runtime type checking
export function isValidUserRole(role: string): role is UserRole {
  return ['admin', 'manager', 'cashier', 'user'].includes(role)
}

export function isVevurnUser(user: any): user is VevurnUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.firstName === 'string' &&
    typeof user.lastName === 'string' &&
    typeof user.role === 'string' &&
    typeof user.isActive === 'boolean' &&
    typeof user.maxDiscountAllowed === 'number' &&
    typeof user.canSellBelowMin === 'boolean'
  )
}

export function isVevurnSession(session: any): session is VevurnSession {
  return (
    typeof session === 'object' &&
    session !== null &&
    typeof session.session === 'object' &&
    typeof session.user === 'object' &&
    isVevurnUser(session.user)
  )
}

// Helper types for API responses
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Export the main auth instance type
export type AuthInstance = typeof auth

// Re-export Better Auth types for convenience
export type { APIError } from 'better-auth/api'
