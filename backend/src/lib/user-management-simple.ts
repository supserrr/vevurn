/**
 * User Management Service for Vevurn POS
 * 
 * Provides comprehensive user and account management utilities with proper TypeScript types
 */

import { PrismaClient } from '@prisma/client'

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

export interface UserStats {
  totalUsers: number
  activeUsers: number
  usersByRole: Record<string, number>
  recentRegistrations: number
}

export class UserManagementService {
  /**
   * Get detailed user information
   */
  static async getUserDetails(userId: string): Promise<UserInfo | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
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
      const updateData: any = {}
      
      // Only include defined values to avoid TypeScript strict mode issues
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.firstName !== undefined) updateData.firstName = updates.firstName
      if (updates.lastName !== undefined) updateData.lastName = updates.lastName
      if (updates.role !== undefined) updateData.role = updates.role
      if (updates.employeeId !== undefined) updateData.employeeId = updates.employeeId
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive
      if (updates.maxDiscountAllowed !== undefined) updateData.maxDiscountAllowed = updates.maxDiscountAllowed
      if (updates.canSellBelowMin !== undefined) updateData.canSellBelowMin = updates.canSellBelowMin
      
      updateData.updatedAt = new Date()

      await prisma.user.update({
        where: { id: userId },
        data: updateData
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
    users: UserInfo[]
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
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.user.count({ where })
      ])

      const userList: UserInfo[] = users.map(user => ({
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
      }))

      return {
        users: userList,
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
  static async getUserStatistics(): Promise<UserStats> {
    try {
      const [totalUsers, activeUsers, usersByRole, recentUsers] = await Promise.all([
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
        })
      ])

      const roleStats: Record<string, number> = {}
      usersByRole.forEach(item => {
        roleStats[item.role] = item._count.role
      })

      return {
        totalUsers,
        activeUsers,
        usersByRole: roleStats,
        recentRegistrations: recentUsers
      }
    } catch (error) {
      console.error('Error getting user statistics:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        usersByRole: {},
        recentRegistrations: 0
      }
    }
  }

  /**
   * Toggle user active status (instead of deletion for audit purposes)
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
   * POS-specific: Update user permissions
   */
  static async updateUserPermissions(userId: string, permissions: {
    maxDiscountAllowed?: number
    canSellBelowMin?: boolean
    role?: string
  }): Promise<boolean> {
    try {
      const updateData: any = { updatedAt: new Date() }
      
      if (permissions.maxDiscountAllowed !== undefined) {
        updateData.maxDiscountAllowed = permissions.maxDiscountAllowed
      }
      if (permissions.canSellBelowMin !== undefined) {
        updateData.canSellBelowMin = permissions.canSellBelowMin
      }
      if (permissions.role !== undefined) {
        updateData.role = permissions.role
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      })

      console.log(`Updated permissions for user ${userId}`)
      return true
    } catch (error) {
      console.error('Error updating user permissions:', error)
      return false
    }
  }

  /**
   * Get users by role (for POS staff management)
   */
  static async getUsersByRole(role: string): Promise<UserInfo[]> {
    try {
      const users = await prisma.user.findMany({
        where: { role, isActive: true },
        orderBy: { firstName: 'asc' }
      })

      return users.map(user => ({
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
      }))
    } catch (error) {
      console.error('Error getting users by role:', error)
      return []
    }
  }

  /**
   * Search users for admin interface
   */
  static async searchUsers(query: string, limit: number = 10): Promise<UserInfo[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { employeeId: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      })

      return users.map(user => ({
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
      }))
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }
}

export default UserManagementService
