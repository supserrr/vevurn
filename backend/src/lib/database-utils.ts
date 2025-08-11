/**
 * Database Utilities for Better Auth & Vevurn POS
 * 
 * Advanced database operations and utilities following Better Auth patterns
 */

import { PrismaClient, type User } from "@prisma/client"

const prisma = new PrismaClient()

// Custom database operations following Better Auth patterns

/**
 * Extended User Operations
 */
export class UserDatabaseOperations {
  /**
   * Create user with POS validation (similar to Better Auth additionalFields pattern)
   */
  static async createPOSUser(userData: {
    email: string
    name: string
    firstName: string
    lastName: string
    role?: string
    employeeId?: string
    maxDiscountAllowed?: number
    canSellBelowMin?: boolean
  }) {
    // Validate employee ID format (POS business rule)
    if (userData.employeeId && !userData.employeeId.match(/^EMP-\d{4}$/)) {
      throw new Error("Employee ID must follow format EMP-XXXX")
    }

    // Generate employee ID if not provided
    const employeeId = userData.employeeId || `EMP-${Date.now().toString().slice(-4)}`

    return await prisma.user.create({
      data: {
        ...userData,
        employeeId,
        role: userData.role || 'cashier',
        isActive: true,
        maxDiscountAllowed: userData.maxDiscountAllowed || 0,
        canSellBelowMin: userData.canSellBelowMin || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
  }

  /**
   * Get users by role (POS-specific query)
   */
  static async getUsersByRole(role: string, includeInactive = false) {
    return await prisma.user.findMany({
      where: {
        role,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        sessions: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          }
        }
      }
    })
  }

  /**
   * Get employee by employee ID (POS-specific lookup)
   */
  static async getEmployeeById(employeeId: string) {
    return await prisma.user.findUnique({
      where: { employeeId },
      include: {
        sessions: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          }
        }
      }
    })
  }

  /**
   * Update user permissions (admin operation)
   */
  static async updateUserPermissions(
    userId: string, 
    permissions: {
      maxDiscountAllowed?: number
      canSellBelowMin?: boolean
      role?: string
    },
    updatedBy: string
  ) {
    // Validate permissions
    if (permissions.maxDiscountAllowed && permissions.maxDiscountAllowed > 50) {
      throw new Error("Maximum discount cannot exceed 50%")
    }

    const result = await prisma.user.update({
      where: { id: userId },
      data: {
        ...permissions,
        updatedAt: new Date(),
      }
    })

    // Log the permission change
    console.log(`👑 Permissions updated for ${result.email} by user ${updatedBy}`)
    
    return result
  }

  /**
   * Deactivate user and cleanup sessions
   */
  static async deactivateUser(userId: string, deactivatedBy: string) {
    // Deactivate user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      }
    })

    // Clean up active sessions
    await prisma.session.deleteMany({
      where: { userId }
    })

    console.log(`🚫 User ${user.email} deactivated by ${deactivatedBy}`)
    
    return user
  }
}

/**
 * Session Database Operations
 */
export class SessionDatabaseOperations {
  /**
   * Get active sessions for a user
   */
  static async getActiveSessions(userId: string) {
    return await prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  /**
   * Cleanup expired sessions (maintenance operation)
   */
  static async cleanupExpiredSessions() {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    console.log(`🧹 Cleaned up ${result.count} expired sessions`)
    return result
  }

  /**
   * Get session statistics (admin dashboard)
   */
  static async getSessionStats() {
    const [totalSessions, activeSessions, expiredSessions] = await Promise.all([
      prisma.session.count(),
      prisma.session.count({
        where: {
          expiresAt: {
            gt: new Date()
          }
        }
      }),
      prisma.session.count({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    ])

    return {
      total: totalSessions,
      active: activeSessions,
      expired: expiredSessions,
    }
  }
}

/**
 * Account Database Operations (OAuth management)
 */
export class AccountDatabaseOperations {
  /**
   * Link OAuth account to existing user
   */
  static async linkOAuthAccount(userId: string, accountData: {
    providerId: string
    accountId: string
    accessToken?: string
    refreshToken?: string
    scope?: string
  }) {
    return await prisma.account.create({
      data: {
        userId,
        ...accountData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
  }

  /**
   * Get user's OAuth providers
   */
  static async getUserOAuthProviders(userId: string) {
    return await prisma.account.findMany({
      where: { userId },
      select: {
        providerId: true,
        createdAt: true,
      }
    })
  }

  /**
   * Unlink OAuth account
   */
  static async unlinkOAuthAccount(userId: string, providerId: string) {
    return await prisma.account.deleteMany({
      where: {
        userId,
        providerId
      }
    })
  }
}

/**
 * Database Health & Maintenance
 */
export class DatabaseMaintenance {
  /**
   * Database health check
   */
  static async healthCheck() {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`
      
      // Get table counts
      const [userCount, sessionCount, accountCount] = await Promise.all([
        prisma.user.count(),
        prisma.session.count(),
        prisma.account.count(),
      ])

      return {
        status: 'healthy',
        tables: {
          users: userCount,
          sessions: sessionCount,
          accounts: accountCount,
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Cleanup routine (run periodically)
   */
  static async performMaintenance() {
    console.log('🔧 Starting database maintenance...')
    
    // Clean expired sessions
    const sessionCleanup = await SessionDatabaseOperations.cleanupExpiredSessions()
    
    // Clean expired verification tokens
    const verificationCleanup = await prisma.verification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    console.log(`✅ Maintenance complete: ${sessionCleanup.count} sessions, ${verificationCleanup.count} verification tokens cleaned`)
    
    return {
      sessionsDeleted: sessionCleanup.count,
      verificationsDeleted: verificationCleanup.count,
      timestamp: new Date().toISOString(),
    }
  }
}

// Export utilities
export {
  UserDatabaseOperations as Users,
  SessionDatabaseOperations as Sessions,
  AccountDatabaseOperations as Accounts,
  DatabaseMaintenance as Maintenance,
}
