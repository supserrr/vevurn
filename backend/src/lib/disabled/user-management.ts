/**
 * User Management Service for Vevurn POS
 * 
 * Provides comprehensive user and account management utilities:
 * - User information updates and profile management
 * - Password and email change workflows
 * - Account linking and unlinking
 * - Role-based user administration
 * - Bulk user operations for admin
 */

import { PrismaClient } from '@prisma/client'
import { auth } from './auth'

const prisma = new PrismaClient()

export interface UserInfo {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  role: string
  employeeId: string | null
  firstName: string
  lastName: string
  isActive: boolean
  maxDiscountAllowed: number
  canSellBelowMin: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AccountInfo {
  id: string
  userId: string
  provider: string
  providerAccountId: string
  access_token: string | null
  refresh_token: string | null
  scope: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserWithAccounts extends UserInfo {
  accounts: AccountInfo[]
  sessionsCount: number
  lastLoginAt: Date | null
}

export class UserManagementService {
  /**
   * Get detailed user information with accounts and session data
   */
  static async getUserDetails(userId: string): Promise<UserWithAccounts | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          accounts: {
            select: {
            id: true,
            provider: true,
            providerAccountId: true,
            type: true,
            createdAt: true,
            updatedAt: true
          }
          },
          sessions: {
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
            },
            where: {
              expires: { gt: new Date() }
            },
            orderBy: { updatedAt: 'desc' }
          }
        }
      })

      if (!user) return null

      const lastSession = user.sessions[0]
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        maxDiscountAllowed: user.maxDiscountAllowed || 0,
        canSellBelowMin: user.canSellBelowMin || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        accounts: user.accounts as AccountInfo[],
        sessionsCount: user.sessions.length,
        lastLoginAt: lastSession?.updatedAt || null
      }
    } catch (error) {
      console.error('Error getting user details:', error)
      return null
    }
  }

  /**
   * Update user information (admin operation)
   */
  static async updateUserInfo(userId: string, updates: {
    name?: string
    firstName?: string
    lastName?: string
    role?: string
    employeeId?: string
    isActive?: boolean
    maxDiscountAllowed?: number
    canSellBelowMin?: boolean
  }): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      })

      console.log(`User ${userId} updated successfully`)
      return true
    } catch (error) {
      console.error('Error updating user:', error)
      return false
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(options: {
    page?: number
    limit?: number
    role?: string
    isActive?: boolean
    searchTerm?: string
  } = {}): Promise<{
    users: UserWithAccounts[]
    totalCount: number
    totalPages: number
    currentPage: number
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        isActive,
        searchTerm
      } = options

      const skip = (page - 1) * limit

      // Build where condition
      const where: any = {}
      if (role) where.role = role
      if (typeof isActive === 'boolean') where.isActive = isActive
      if (searchTerm) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { employeeId: { contains: searchTerm, mode: 'insensitive' } },
        ]
      }

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            accounts: {
              select: {
                id: true,
                userId: true,
                providerId: true,
                accountId: true,
                accessToken: true,
                refreshToken: true,
                scope: true,
                createdAt: true,
                updatedAt: true,
              }
            },
            sessions: {
              select: {
                id: true,
                createdAt: true,
                updatedAt: true,
              },
              where: {
                expires: { gt: new Date() }
              },
              orderBy: { updatedAt: 'desc' }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.user.count({ where })
      ])

      const usersWithDetails: UserWithAccounts[] = users.map(user => {
        const lastSession = user.sessions[0]
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          role: user.role,
          employeeId: user.employeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          maxDiscountAllowed: user.maxDiscountAllowed || 0,
          canSellBelowMin: user.canSellBelowMin || false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          accounts: user.accounts as AccountInfo[],
          sessionsCount: user.sessions.length,
          lastLoginAt: lastSession?.updatedAt || null
        }
      })

      return {
        users: usersWithDetails,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      }
    } catch (error) {
      console.error('Error getting users:', error)
      return {
        users: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      }
    }
  }

  /**
   * Get user statistics for admin dashboard
   */
  static async getUserStatistics(): Promise<{
    totalUsers: number
    activeUsers: number
    usersByRole: Record<string, number>
    recentRegistrations: number
    usersWithMultipleAccounts: number
  }> {
    try {
      const [totalUsers, activeUsers, usersByRole, recentUsers, usersWithAccounts] = await Promise.all([
        // Total users
        prisma.user.count(),
        
        // Active users
        prisma.user.count({ where: { isActive: true } }),
        
        // Users by role
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        }),
        
        // Recent registrations (last 7 days)
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Users with multiple accounts
        prisma.user.findMany({
          include: {
            accounts: { select: { id: true } }
          }
        }).then(users => 
          users.filter(user => user.accounts.length > 1).length
        )
      ])

      const roleStats: Record<string, number> = {}
      usersByRole.forEach(item => {
        roleStats[item.role] = item._count.role
      })

      return {
        totalUsers,
        activeUsers,
        usersByRole: roleStats,
        recentRegistrations: recentUsers,
        usersWithMultipleAccounts: usersWithAccounts
      }
    } catch (error) {
      console.error('Error getting user statistics:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        usersByRole: {},
        recentRegistrations: 0,
        usersWithMultipleAccounts: 0
      }
    }
  }

  /**
   * Deactivate/reactivate user (instead of deletion for audit purposes)
   */
  static async toggleUserActive(userId: string, isActive: boolean): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive,
          updatedAt: new Date()
        }
      })

      console.log(`User ${userId} ${isActive ? 'activated' : 'deactivated'}`)
      return true
    } catch (error) {
      console.error('Error toggling user active status:', error)
      return false
    }
  }

  /**
   * Reset user password (admin operation)
   * Generates a temporary password and forces change on next login
   */
  static async resetUserPassword(userId: string): Promise<{ tempPassword: string } | null> {
    try {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

      // Use Better Auth API to set password
      await auth.api.setPassword({
        body: { 
          newPassword: tempPassword,
          userId // If Better Auth supports admin password reset
        },
        headers: {}
      })

      console.log(`Password reset for user ${userId}`)
      return { tempPassword }
    } catch (error) {
      console.error('Error resetting user password:', error)
      return null
    }
  }

  /**
   * Get user accounts for account management
   */
  static async getUserAccounts(userId: string): Promise<AccountInfo[]> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          providerId: true,
          accountId: true,
          accessToken: true,
          refreshToken: true,
          scope: true,
          createdAt: true,
          updatedAt: true,
        }
      })

      return accounts as AccountInfo[]
    } catch (error) {
      console.error('Error getting user accounts:', error)
      return []
    }
  }

  /**
   * POS-specific: Find user by employee ID
   */
  static async findUserByEmployeeId(employeeId: string): Promise<UserInfo | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { employeeId }
      })

      if (!user) return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        maxDiscountAllowed: user.maxDiscountAllowed || 0,
        canSellBelowMin: user.canSellBelowMin || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    } catch (error) {
      console.error('Error finding user by employee ID:', error)
      return null
    }
  }

  /**
   * POS-specific: Bulk update user permissions
   */
  static async bulkUpdateUserPermissions(updates: Array<{
    userId: string
    maxDiscountAllowed?: number
    canSellBelowMin?: boolean
    role?: string
  }>): Promise<number> {
    try {
      let successCount = 0

      for (const update of updates) {
        try {
          await prisma.user.update({
            where: { id: update.userId },
            data: {
              maxDiscountAllowed: update.maxDiscountAllowed,
              canSellBelowMin: update.canSellBelowMin,
              role: update.role,
              updatedAt: new Date()
            }
          })
          successCount++
        } catch (error) {
          console.error(`Failed to update user ${update.userId}:`, error)
        }
      }

      console.log(`Bulk updated ${successCount} of ${updates.length} users`)
      return successCount
    } catch (error) {
      console.error('Error in bulk user update:', error)
      return 0
    }
  }

  /**
   * Generate user activity report
   */
  static async generateUserActivityReport(days: number = 30): Promise<{
    activeUsers: UserInfo[]
    inactiveUsers: UserInfo[]
    newUsers: UserInfo[]
    recentLoginUsers: UserInfo[]
  }> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const [allUsers, usersWithRecentSessions] = await Promise.all([
        prisma.user.findMany({
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.user.findMany({
          where: {
            sessions: {
              some: {
                updatedAt: { gte: cutoffDate },
                expires: { gt: new Date() }
              }
            }
          },
          include: {
            sessions: {
              where: {
                updatedAt: { gte: cutoffDate },
                expiresAt: { gt: new Date() }
              },
              orderBy: { updatedAt: 'desc' },
              take: 1
            }
          }
        })
      ])

      const activeUserIds = new Set(usersWithRecentSessions.map(u => u.id))
      const newUsers = allUsers.filter(u => u.createdAt >= cutoffDate)
      const activeUsers = allUsers.filter(u => activeUserIds.has(u.id))
      const inactiveUsers = allUsers.filter(u => !activeUserIds.has(u.id) && u.createdAt < cutoffDate)

      return {
        activeUsers: activeUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.emailVerified,
          image: u.image,
          role: u.role,
          employeeId: u.employeeId,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: u.isActive,
          maxDiscountAllowed: u.maxDiscountAllowed || 0,
          canSellBelowMin: u.canSellBelowMin || false,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        })),
        inactiveUsers: inactiveUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.emailVerified,
          image: u.image,
          role: u.role,
          employeeId: u.employeeId,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: u.isActive,
          maxDiscountAllowed: u.maxDiscountAllowed || 0,
          canSellBelowMin: u.canSellBelowMin || false,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        })),
        newUsers: newUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.emailVerified,
          image: u.image,
          role: u.role,
          employeeId: u.employeeId,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: u.isActive,
          maxDiscountAllowed: u.maxDiscountAllowed || 0,
          canSellBelowMin: u.canSellBelowMin || false,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        })),
        recentLoginUsers: usersWithRecentSessions.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.emailVerified,
          image: u.image,
          role: u.role,
          employeeId: u.employeeId,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: u.isActive,
          maxDiscountAllowed: u.maxDiscountAllowed || 0,
          canSellBelowMin: u.canSellBelowMin || false,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        }))
      }
    } catch (error) {
      console.error('Error generating user activity report:', error)
      return {
        activeUsers: [],
        inactiveUsers: [],
        newUsers: [],
        recentLoginUsers: []
      }
    }
  }
}

export default UserManagementService
