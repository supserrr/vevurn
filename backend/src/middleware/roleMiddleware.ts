import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { AuthenticatedRequest } from './auth'

const ROLE_HIERARCHY: Record<string, number> = {
  'cashier': 1,
  'supervisor': 2,
  'manager': 3,
  'admin': 4
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  'cashier': [
    'sales:create',
    'sales:read',
    'products:read',
    'customers:create',
    'customers:read',
    'customers:update'
  ],
  'supervisor': [
    'sales:create',
    'sales:read',
    'sales:update',
    'products:read',
    'products:update',
    'customers:create',
    'customers:read',
    'customers:update',
    'customers:delete',
    'inventory:read',
    'inventory:update',
    'reports:read'
  ],
  'manager': [
    'sales:*',
    'products:*',
    'customers:*',
    'inventory:*',
    'suppliers:*',
    'staff:read',
    'staff:create',
    'staff:update',
    'reports:*',
    'loans:*',
    'settings:read'
  ],
  'admin': [
    '*' // Full access
  ]
}

/**
 * Middleware to check if user has required role
 */
export function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
        return
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        })
        return
      }

      const userRole = user.role
      const userRoleLevel = ROLE_HIERARCHY[userRole] || 0
      
      // Check if user has any of the allowed roles
      const hasRequiredRole = allowedRoles.some(role => {
        const requiredLevel = ROLE_HIERARCHY[role] || 0
        return userRoleLevel >= requiredLevel
      })

      if (!hasRequiredRole) {
        logger.warn(`Access denied for user ${user.email} with role ${userRole}. Required roles: ${allowedRoles.join(', ')}`)
        
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        })
        return
      }

      // Log successful access
      logger.info(`Access granted for user ${user.email} with role ${userRole}`)
      next()

    } catch (error) {
      logger.error('Role middleware error:', error)
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      })
    }
  }
}

/**
 * Middleware to check specific permissions
 */
export function permissionMiddleware(requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
        return
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        })
        return
      }

      const userRole = user.role
      const userPermissions = ROLE_PERMISSIONS[userRole] || []

      // Check if user has admin role (full access)
      if (userPermissions.includes('*')) {
        next()
        return
      }

      // Check each required permission
      const hasAllPermissions = requiredPermissions.every(permission => {
        // Check exact permission match
        if (userPermissions.includes(permission)) {
          return true
        }

        // Check wildcard permissions (e.g., 'sales:*' covers 'sales:create')
        const [resource] = permission.split(':')
        const wildcardPermission = `${resource}:*`
        
        return userPermissions.includes(wildcardPermission)
      })

      if (!hasAllPermissions) {
        logger.warn(`Permission denied for user ${user.email}. Required: ${requiredPermissions.join(', ')}, Available: ${userPermissions.join(', ')}`)
        
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: requiredPermissions,
          available: userPermissions
        })
        return
      }

      next()

    } catch (error) {
      logger.error('Permission middleware error:', error)
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      })
    }
  }
}

/**
 * Middleware to check if user owns the resource or has elevated permissions
 */
export function ownershipMiddleware(
  resourceUserIdField: string = 'userId',
  allowedRoles: string[] = ['manager', 'admin']
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
        return
      }

      // Check if user has elevated role
      const userRoleLevel = ROLE_HIERARCHY[user.role] || 0
      const hasElevatedRole = allowedRoles.some(role => {
        const requiredLevel = ROLE_HIERARCHY[role] || 0
        return userRoleLevel >= requiredLevel
      })

      if (hasElevatedRole) {
        next()
        return
      }

      // Check ownership
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField]
      
      if (resourceUserId && resourceUserId === user.id) {
        next()
        return
      }

      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      })

    } catch (error) {
      logger.error('Ownership middleware error:', error)
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      })
    }
  }
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole] || []
  
  // Admin has all permissions
  if (userPermissions.includes('*')) {
    return true
  }

  // Check exact permission
  if (userPermissions.includes(requiredPermission)) {
    return true
  }

  // Check wildcard permissions
  const [resource] = requiredPermission.split(':')
  const wildcardPermission = `${resource}:*`
  
  return userPermissions.includes(wildcardPermission)
}

/**
 * Middleware for development/testing - allows bypassing role checks
 */
export function devBypassMiddleware() {
  return (_req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_ROLE_CHECK === 'true') {
      logger.warn('Role check bypassed in development mode')
      next()
      return
    }
    
    // In production, this middleware does nothing
    next()
  }
}

// Export individual role middleware for convenience
export const adminOnly = roleMiddleware(['admin'])
export const managerOrAdmin = roleMiddleware(['manager', 'admin'])
export const supervisorOrAbove = roleMiddleware(['supervisor', 'manager', 'admin'])
export const allStaff = roleMiddleware(['cashier', 'supervisor', 'manager', 'admin'])
