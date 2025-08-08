/**
 * Frontend type definitions for Better Auth
 * 
 * Frontend-specific types that mirror the backend types
 */

// Frontend user interface (mirrors backend VevurnUser)
export interface VevurnUser {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
  role: string
  employeeId: string | null
  firstName: string
  lastName: string
  isActive: boolean
  maxDiscountAllowed: number
  canSellBelowMin: boolean
}

// Frontend session interface (mirrors backend VevurnSession)
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

// API response wrapper
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// User roles
export type UserRole = 'admin' | 'manager' | 'cashier' | 'user'

// User permissions
export interface UserPermissions {
  role: UserRole
  maxDiscountAllowed: number
  canSellBelowMin: boolean
  isActive: boolean
}

// User filters for API requests
export interface UserFilters {
  role?: UserRole
  isActive?: boolean
  searchTerm?: string
  limit?: number
  page?: number
}

// Clock in data
export interface ClockInData {
  employeeId: string
  userId: string
  clockInTime: Date
  sessionId: string
}

// Discount permission check
export interface DiscountPermission {
  canApplyDiscount: boolean
  maxAllowed: number
  requestedDiscount: number
}
