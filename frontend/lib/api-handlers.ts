/**
 * Type-safe API route handlers for Better Auth (Frontend)
 * 
 * Provides properly typed API endpoints with Better Auth integration
 * Note: This is a template - actual implementation would be in API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import type { 
  VevurnUser, 
  VevurnSession, 
  APIResponse, 
  UserPermissions,
  ClockInData,
  DiscountPermission
} from './types'

// Mock auth function (in real implementation, this would be imported from backend)
const mockAuth = {
  api: {
    getSession: async ({ headers }: { headers: Headers }): Promise<VevurnSession | null> => {
      // This would be the actual Better Auth session check
      return null
    }
  }
}

// Helper to get session with proper typing
export async function getTypedSession(request: NextRequest): Promise<VevurnSession | null> {
  try {
    const session = await mockAuth.api.getSession({
      headers: request.headers
    })
    
    return session as VevurnSession | null
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Helper to require authentication with proper typing
export async function requireAuth(request: NextRequest): Promise<VevurnSession> {
  const session = await getTypedSession(request)
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  if (!session.user.isActive) {
    throw new Error('Account is inactive')
  }
  
  return session
}

// Helper to require specific role
export async function requireRole(
  request: NextRequest, 
  requiredRole: 'admin' | 'manager' | 'cashier' | 'user'
): Promise<VevurnSession> {
  const session = await requireAuth(request)
  
  const roleHierarchy = {
    user: 0,
    cashier: 1,
    manager: 2,
    admin: 3
  }
  
  const userLevel = roleHierarchy[session.user.role as keyof typeof roleHierarchy] ?? 0
  const requiredLevel = roleHierarchy[requiredRole] ?? 0
  
  if (userLevel < requiredLevel) {
    throw new Error(`Insufficient permissions. ${requiredRole} role required.`)
  }
  
  return session
}

// Generic API response wrapper with proper typing
export function createAPIResponse<T>(
  data?: T,
  success: boolean = true,
  message?: string,
  status: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json({
    success,
    data,
    message
  }, { status })
}

// Error response helper
export function createErrorResponse(
  error: string,
  status: number = 400
): NextResponse<APIResponse<never>> {
  return NextResponse.json({
    success: false,
    error,
  }, { status })
}

// Higher-order function for protected API routes
export function withAuth<T>(
  handler: (request: NextRequest, session: VevurnSession) => Promise<NextResponse<APIResponse<T>>>
) {
  return async (request: NextRequest): Promise<NextResponse<APIResponse<T>>> => {
    try {
      const session = await requireAuth(request)
      return await handler(request, session)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      return createErrorResponse(message, 401)
    }
  }
}

// Higher-order function for role-protected API routes
export function withRole<T>(
  requiredRole: 'admin' | 'manager' | 'cashier' | 'user',
  handler: (request: NextRequest, session: VevurnSession) => Promise<NextResponse<APIResponse<T>>>
) {
  return async (request: NextRequest): Promise<NextResponse<APIResponse<T>>> => {
    try {
      const session = await requireRole(request, requiredRole)
      return await handler(request, session)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authorization failed'
      const status = message.includes('Authentication') ? 401 : 403
      return createErrorResponse(message, status)
    }
  }
}

// Example typed API route handlers
export const userAPIHandlers = {
  // Get current user info
  getCurrentUser: withAuth(async (request, session) => {
    return createAPIResponse(session.user)
  }),
  
  // Get user permissions (cashier+ access)
  getUserPermissions: withRole('cashier', async (request, session) => {
    const permissions: UserPermissions = {
      role: session.user.role as 'admin' | 'manager' | 'cashier' | 'user',
      maxDiscountAllowed: session.user.maxDiscountAllowed,
      canSellBelowMin: session.user.canSellBelowMin,
      isActive: session.user.isActive
    }
    
    return createAPIResponse(permissions)
  }),
  
  // Update user profile
  updateProfile: withAuth(async (request, session) => {
    try {
      const body = await request.json()
      const { name, firstName, lastName } = body
      
      // Validate input
      if (!firstName || !lastName) {
        return createErrorResponse('First name and last name are required')
      }
      
      // Here you would update the user in the database
      // This is a placeholder - you'd use your user service
      const updatedUser = {
        ...session.user,
        name: name || `${firstName} ${lastName}`,
        firstName,
        lastName
      }
      
      return createAPIResponse(updatedUser)
    } catch (error) {
      return createErrorResponse('Failed to update profile')
    }
  }),
  
  // Admin: Get all users
  getAllUsers: withRole('admin', async (request, session) => {
    try {
      // This would use your user service to get all users
      const users: VevurnUser[] = [] // await getUserService().getAllUsers()
      
      return createAPIResponse(users)
    } catch (error) {
      return createErrorResponse('Failed to retrieve users')
    }
  }),
  
  // Manager: Get users by role
  getUsersByRole: withRole('manager', async (request, session) => {
    try {
      const { searchParams } = new URL(request.url)
      const role = searchParams.get('role')
      
      if (!role) {
        return createErrorResponse('Role parameter is required')
      }
      
      // This would use your user service
      const users: VevurnUser[] = [] // await getUserService().getUsersByRole(role)
      
      return createAPIResponse(users)
    } catch (error) {
      return createErrorResponse('Failed to retrieve users by role')
    }
  })
}

// POS-specific API handlers
export const posAPIHandlers = {
  // Clock in (requires employee ID)
  clockIn: withAuth(async (request, session) => {
    if (!session.user.employeeId) {
      return createErrorResponse('Employee ID is required for clock in')
    }
    
    // Clock in logic here
    const clockInData: ClockInData = {
      employeeId: session.user.employeeId,
      userId: session.user.id,
      clockInTime: new Date(),
      sessionId: session.session.id
    }
    
    return createAPIResponse(clockInData)
  }),
  
  // Check discount permissions
  checkDiscountPermission: withRole('cashier', async (request, session) => {
    try {
      const { searchParams } = new URL(request.url)
      const discount = parseFloat(searchParams.get('discount') || '0')
      
      const canApply = session.user.isActive && 
                      discount <= session.user.maxDiscountAllowed
      
      const result: DiscountPermission = {
        canApplyDiscount: canApply,
        maxAllowed: session.user.maxDiscountAllowed,
        requestedDiscount: discount
      }
      
      return createAPIResponse(result)
    } catch (error) {
      return createErrorResponse('Failed to check discount permission')
    }
  })
}

// Export all handlers for easy use in API routes
export const apiHandlers = {
  ...userAPIHandlers,
  ...posAPIHandlers
}
