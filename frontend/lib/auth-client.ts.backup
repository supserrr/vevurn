/**
 * Better Auth Client for Vevurn POS Frontend
 * 
 * Provides type-safe authentication client with inferred additional fields
 */

import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"

// Define additional fields that match the backend configuration
const additionalFields = {
  user: {
    role: {
      type: "string" as const
    },
    employeeId: {
      type: "string" as const
    },
    firstName: {
      type: "string" as const
    },
    lastName: {
      type: "string" as const
    },
    isActive: {
      type: "boolean" as const
    },
    maxDiscountAllowed: {
      type: "number" as const
    },
    canSellBelowMin: {
      type: "boolean" as const
    }
  }
}

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:8000",
  basePath: "/api/better-auth",
  plugins: [
    inferAdditionalFields(additionalFields)
  ]
})

// Export specific methods for convenience with proper typing
export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession, 
  getSession,
  changeEmail,
  deleteUser,
  linkSocial
} = authClient

// Export type-safe session and user types
export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session['user']

// POS-specific user roles
export type UserRole = 'admin' | 'manager' | 'cashier' | 'user'

// Enhanced user interface for POS operations
export interface POSUser {
  id: string
  email: string
  emailVerified: boolean | null
  name: string | null
  createdAt: Date
  updatedAt: Date
  image?: string | null
  role: UserRole
  employeeId: string | null
  firstName: string
  lastName: string
  isActive: boolean
  maxDiscountAllowed: number
  canSellBelowMin: boolean
}

// Type guard for POS user
export function isPOSUser(user: any): user is POSUser {
  return user && typeof user.role === 'string' && typeof user.firstName === 'string'
}

// Permission helper functions
export function canApplyDiscount(user: POSUser, discountPercent: number): boolean {
  return user.isActive && discountPercent <= user.maxDiscountAllowed
}

export function canSellBelowMinimum(user: POSUser): boolean {
  return user.isActive && user.canSellBelowMin
}

export function hasAdminAccess(user: POSUser): boolean {
  return user.isActive && user.role === 'admin'
}

export function hasManagerAccess(user: POSUser): boolean {
  return user.isActive && (user.role === 'admin' || user.role === 'manager')
}

// Auth client instance type for advanced usage
export type AuthClientType = typeof authClient
