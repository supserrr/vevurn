/**
 * User Management Service for Vevurn POS
 * Working implementation with Better Auth integration and proper TypeScript types
 */

import { PrismaClient } from '@prisma/client'
import type { VevurnUser, UserRole, UserFilters, UserStats, UpdateUserData } from './auth-types'

const prisma = new PrismaClient()

export interface SimpleUserInfo {
  id: string
  name: string | null
  email: string
  role: string
  employeeId: string | null
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: Date
}

// Convert Prisma user to VevurnUser type
function mapPrismaUserToVevurnUser(user: any): VevurnUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role,
    employeeId: user.employeeId,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    maxDiscountAllowed: user.maxDiscountAllowed || 0,
    canSellBelowMin: user.canSellBelowMin || false
  }
}

export async function getUserById(userId: string): Promise<VevurnUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) return null

    return mapPrismaUserToVevurnUser(user)
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function getUsersByRole(role: UserRole): Promise<VevurnUser[]> {
  try {
    const users = await prisma.user.findMany({
      where: { role, isActive: true },
      orderBy: { firstName: 'asc' }
    })

    return users.map(mapPrismaUserToVevurnUser)
  } catch (error) {
    console.error('Error getting users by role:', error)
    return []
  }
}

export async function getUserStats(): Promise<UserStats> {
  try {
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { isActive: true } })
    
    // Get recent registrations (last 7 days)
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    // Get users by role
    const roleGroups = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    })

    const usersByRole: Record<UserRole, number> = {
      admin: 0,
      manager: 0,
      cashier: 0,
      user: 0
    }

    roleGroups.forEach(group => {
      if (group.role in usersByRole) {
        usersByRole[group.role as UserRole] = group._count.role
      }
    })
    
    return {
      totalUsers,
      activeUsers,
      usersByRole,
      recentRegistrations: recentUsers
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return { 
      totalUsers: 0, 
      activeUsers: 0, 
      usersByRole: { admin: 0, manager: 0, cashier: 0, user: 0 },
      recentRegistrations: 0 
    }
  }
}

/**
 * Update user information with type safety
 */
export async function updateUser(userId: string, data: UpdateUserData): Promise<boolean> {
  try {
    const updateData: any = { updatedAt: new Date() }
    
    // Only include defined values
    Object.keys(data).forEach(key => {
      const value = data[key as keyof UpdateUserData]
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    return true
  } catch (error) {
    console.error('Error updating user:', error)
    return false
  }
}

/**
 * Get users with filtering and type safety
 */
export async function getUsers(filters: UserFilters = {}): Promise<VevurnUser[]> {
  try {
    const { role, isActive, searchTerm, limit = 50 } = filters

    const where: any = {}
    if (role) where.role = role
    if (typeof isActive === 'boolean') where.isActive = isActive
    if (searchTerm) {
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { employeeId: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      take: limit,
      orderBy: { firstName: 'asc' }
    })

    return users.map(mapPrismaUserToVevurnUser)
  } catch (error) {
    console.error('Error getting users:', error)
    return []
  }
}

/**
 * Find user by employee ID with proper typing
 */
export async function getUserByEmployeeId(employeeId: string): Promise<VevurnUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { employeeId }
    })

    if (!user) return null

    return mapPrismaUserToVevurnUser(user)
  } catch (error) {
    console.error('Error finding user by employee ID:', error)
    return null
  }
}

export default {
  getUserById,
  getUsersByRole,
  getUserStats,
  updateUser,
  getUsers,
  getUserByEmployeeId
}
