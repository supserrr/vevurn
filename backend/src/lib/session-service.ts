/**
 * Session Management Service for Vevurn POS
 * 
 * Provides utilities for managing user sessions with POS-specific features:
 * - Session validation and freshness checks
 * - Bulk session management for admin operations
 * - Session activity tracking
 * - POS shift management integration
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SessionInfo {
  id: string
  userId: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  isFresh: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string
    employeeId: string
  }
}

export interface SessionActivity {
  sessionId: string
  userId: string
  activityType: 'login' | 'logout' | 'refresh' | 'revoke'
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export class SessionService {
  /**
   * Get detailed session information including freshness and user data
   */
  static async getSessionDetails(sessionToken: string): Promise<SessionInfo | null> {
    try {
      // Get session from database with user information
      const session = await prisma.session.findUnique({
        where: { id: sessionToken },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              employeeId: true,
            }
          }
        }
      })

      if (!session) return null

      const now = new Date()
      const isActive = session.expiresAt > now
      
      // Check freshness (30 minutes by default from auth config)
      const freshAge = 30 * 60 * 1000 // 30 minutes in milliseconds
      const isFresh = (now.getTime() - session.createdAt.getTime()) <= freshAge

      return {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive,
        isFresh,
        user: session.user as any
      }
    } catch (error) {
      console.error('Error getting session details:', error)
      return null
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              employeeId: true,
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      const now = new Date()
      const freshAge = 30 * 60 * 1000 // 30 minutes

      return sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive: session.expiresAt > now,
        isFresh: (now.getTime() - session.createdAt.getTime()) <= freshAge,
        user: session.user as any
      }))
    } catch (error) {
      console.error('Error getting user active sessions:', error)
      return []
    }
  }

  /**
   * Revoke specific session by token
   */
  static async revokeSession(sessionToken: string, reason?: string): Promise<boolean> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionToken }
      })

      if (!session) return false

      // Log the revocation activity
      await this.logSessionActivity({
        sessionId: sessionToken,
        userId: session.userId,
        activityType: 'revoke',
        timestamp: new Date(),
        metadata: { reason }
      })

      // Delete the session
      await prisma.session.delete({
        where: { id: sessionToken }
      })

      return true
    } catch (error) {
      console.error('Error revoking session:', error)
      return false
    }
  }

  /**
   * Revoke all sessions for a user except current session
   */
  static async revokeOtherSessions(userId: string, currentSessionToken: string): Promise<number> {
    try {
      const sessionsToRevoke = await prisma.session.findMany({
        where: {
          userId,
          id: {
            not: currentSessionToken
          }
        }
      })

      // Log revocation for each session
      for (const session of sessionsToRevoke) {
        await this.logSessionActivity({
          sessionId: session.id,
          userId: session.userId,
          activityType: 'revoke',
          timestamp: new Date(),
          metadata: { reason: 'bulk_revoke_other_sessions' }
        })
      }

      // Delete all other sessions
      const result = await prisma.session.deleteMany({
        where: {
          userId,
          id: {
            not: currentSessionToken
          }
        }
      })

      return result.count
    } catch (error) {
      console.error('Error revoking other sessions:', error)
      return 0
    }
  }

  /**
   * Revoke all sessions for a user
   */
  static async revokeAllSessions(userId: string): Promise<number> {
    try {
      const sessionsToRevoke = await prisma.session.findMany({
        where: { userId }
      })

      // Log revocation for each session
      for (const session of sessionsToRevoke) {
        await this.logSessionActivity({
          sessionId: session.id,
          userId: session.userId,
          activityType: 'revoke',
          timestamp: new Date(),
          metadata: { reason: 'bulk_revoke_all_sessions' }
        })
      }

      // Delete all sessions
      const result = await prisma.session.deleteMany({
        where: { userId }
      })

      return result.count
    } catch (error) {
      console.error('Error revoking all sessions:', error)
      return 0
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })

      console.log(`Cleaned up ${result.count} expired sessions`)
      return result.count
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error)
      return 0
    }
  }

  /**
   * Get session statistics for admin dashboard
   */
  static async getSessionStats(): Promise<{
    totalActiveSessions: number
    totalUsers: number
    sessionsPerUser: Record<string, number>
    sessionsByRole: Record<string, number>
    recentActivity: SessionActivity[]
  }> {
    try {
      const now = new Date()
      
      // Get all active sessions with user data
      const activeSessions = await prisma.session.findMany({
        where: {
          expiresAt: {
            gt: now
          }
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              employeeId: true
            }
          }
        }
      })

      // Calculate statistics
      const sessionsPerUser: Record<string, number> = {}
      const sessionsByRole: Record<string, number> = {}
      const uniqueUsers = new Set<string>()

      activeSessions.forEach(session => {
        const userId = session.userId
        const userRole = session.user.role

        uniqueUsers.add(userId)
        sessionsPerUser[userId] = (sessionsPerUser[userId] || 0) + 1
        sessionsByRole[userRole] = (sessionsByRole[userRole] || 0) + 1
      })

      // Get recent activity (you might want to implement session activity logging)
      const recentActivity: SessionActivity[] = []

      return {
        totalActiveSessions: activeSessions.length,
        totalUsers: uniqueUsers.size,
        sessionsPerUser,
        sessionsByRole,
        recentActivity
      }
    } catch (error) {
      console.error('Error getting session stats:', error)
      return {
        totalActiveSessions: 0,
        totalUsers: 0,
        sessionsPerUser: {},
        sessionsByRole: {},
        recentActivity: []
      }
    }
  }

  /**
   * Check if session requires fresh authentication for sensitive operations
   */
  static async requiresFreshAuth(sessionToken: string): Promise<boolean> {
    const sessionInfo = await this.getSessionDetails(sessionToken)
    return sessionInfo ? !sessionInfo.isFresh : true
  }

  /**
   * Log session activity for audit purposes
   */
  private static async logSessionActivity(activity: SessionActivity): Promise<void> {
    try {
      // In a real implementation, you might want to store these in a separate audit table
      console.log('Session activity:', {
        sessionId: activity.sessionId,
        userId: activity.userId,
        type: activity.activityType,
        timestamp: activity.timestamp,
        metadata: activity.metadata
      })

      // Optionally store in database for compliance/audit requirements
      // await prisma.sessionActivity.create({ data: activity })
    } catch (error) {
      console.error('Error logging session activity:', error)
    }
  }

  /**
   * POS-specific: Force logout for shift change
   * Useful when staff shifts end and new employees need to log in
   */
  static async forceShiftLogout(currentUserId: string): Promise<boolean> {
    try {
      const revokedCount = await this.revokeAllSessions(currentUserId)
      
      console.log(`Shift logout completed for user ${currentUserId}: ${revokedCount} sessions revoked`)
      
      return revokedCount > 0
    } catch (error) {
      console.error('Error during shift logout:', error)
      return false
    }
  }

  /**
   * POS-specific: Get sessions by employee ID for admin management
   */
  static async getSessionsByEmployeeId(employeeId: string): Promise<SessionInfo[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          user: {
            employeeId
          },
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              employeeId: true,
            }
          }
        }
      })

      const now = new Date()
      const freshAge = 30 * 60 * 1000

      return sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive: session.expiresAt > now,
        isFresh: (now.getTime() - session.createdAt.getTime()) <= freshAge,
        user: session.user as any
      }))
    } catch (error) {
      console.error('Error getting sessions by employee ID:', error)
      return []
    }
  }
}

export default SessionService
