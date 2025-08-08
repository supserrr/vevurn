// Core user and authentication types
import { UserRole } from '../constants'

export interface User {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AuthContext {
  user: User | null
  isAuthenticated: boolean
  permissions: string[]
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}
