/**
 * Session Management Service for Vevurn POS
 * 
 * This service provides session management utilities specifically designed for the POS environment,
 * working with Better Auth session management and our Prisma database schema.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SessionInfo {
  id: string
  userId: string
  expires: Date
  sessionToken: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  isFresh: boolean
  user?: {
    id: string
    name: string | null
    email: string
    role: string
    employeeId: string | null
  }
}

export class SessionService {
  /**
   * Get detailed session information with user data
   */
  static async getSessionDetails(sessionId: string): Promise<SessionInfo | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
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
      const isActive = session.expires > now
      
      // Session is fresh if created within the last 30 minutes
      const freshAge = 30 * 60 * 1000 // 30 minutes in milliseconds
      const isFresh = (now.getTime() - session.createdAt.getTime()) <= freshAge

      return {
        id: session.id,
        userId: session.userId,
        expires: session.expires,
        sessionToken: session.sessionToken,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive,
        isFresh,
        user: session.user
      }
    } catch (error) {
      console.error('Error getting session details:', error)
      return null
    }
  }

  /**
   * Get all active sessions for a specific user
   */
  static async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          expires: { gt: new Date() }
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
        orderBy: { updatedAt: 'desc' }
      })

      const now = new Date()
      const freshAge = 30 * 60 * 1000

      return sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        expires: session.expires,
        sessionToken: session.sessionToken,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive: session.expires > now,
        isFresh: (now.getTime() - session.createdAt.getTime()) <= freshAge,
        user: session.user
      }))
    } catch (error) {
      console.error('Error getting user active sessions:', error)
      return []
    }
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(sessionId: string): Promise<boolean> {
    try {
      await prisma.session.delete({ where: { id: sessionId } })
      console.log(`Session ${sessionId} revoked`)
      return true
    } catch (error) {
      console.error('Error revoking session:', error)
      return false
    }
  }

  /**
   * Revoke all other sessions for a user (except current session)
   */
  static async revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: currentSessionId }
        }
      })

      console.log(`Revoked ${result.count} other sessions for user ${userId}`)
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
      const result = await prisma.session.deleteMany({
        where: { userId }
      })

      console.log(`Revoked all ${result.count} sessions for user ${userId}`)
      return result.count
    } catch (error) {
      console.error('Error revoking all sessions:', error)
      return 0
    }
  }

  /**
   * Clean up expired sessions (maintenance task)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expires: { lt: new Date() }
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
    sessionsByRole: Record<string, number>
    recentSessions: SessionInfo[]
  }> {
    try {
      const activeSessions = await prisma.session.findMany({
        where: {
          expires: { gt: new Date() }
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
        orderBy: { updatedAt: 'desc' },
        take: 10 // Get 10 most recent sessions
      })

      const sessionsByRole: Record<string, number> = {}
      const uniqueUsers = new Set<string>()

      activeSessions.forEach(session => {
        uniqueUsers.add(session.userId)
        const role = session.user.role
        sessionsByRole[role] = (sessionsByRole[role] || 0) + 1
      })

      const now = new Date()
      const freshAge = 30 * 60 * 1000

      const recentSessions: SessionInfo[] = activeSessions.slice(0, 5).map(session => ({
        id: session.id,
        userId: session.userId,
        expires: session.expires,
        sessionToken: session.sessionToken,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive: session.expires > now,
        isFresh: (now.getTime() - session.createdAt.getTime()) <= freshAge,
        user: session.user
      }))

      return {
        totalActiveSessions: activeSessions.length,
        totalUsers: uniqueUsers.size,
        sessionsByRole,
        recentSessions
      }
    } catch (error) {
      console.error('Error getting session stats:', error)
      return {
        totalActiveSessions: 0,
        totalUsers: 0,
        sessionsByRole: {},
        recentSessions: []
      }
    }
  }

  /**
   * Check if session is fresh (for sensitive operations)
   */
  static async isSessionFresh(sessionId: string): Promise<boolean> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { createdAt: true, expires: true }
      })

      if (!session || session.expires <= new Date()) {
        return false
      }

      const freshAge = 30 * 60 * 1000 // 30 minutes
      return (Date.now() - session.createdAt.getTime()) <= freshAge
    } catch (error) {
      console.error('Error checking session freshness:', error)
      return false
    }
  }

  /**
   * POS-specific: Get sessions by employee ID
   */
  static async getSessionsByEmployeeId(employeeId: string): Promise<SessionInfo[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          user: { employeeId },
          expires: { gt: new Date() }
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
        expires: session.expires,
        sessionToken: session.sessionToken,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive: session.expires > now,
        isFresh: (now.getTime() - session.createdAt.getTime()) <= freshAge,
        user: session.user
      }))
    } catch (error) {
      console.error('Error getting sessions by employee ID:', error)
      return []
    }
  }

  /**
   * POS-specific: Force shift logout (revoke all sessions for shift change)
   */
  static async forceShiftLogout(userId: string): Promise<boolean> {
    try {
      const revokedCount = await this.revokeAllSessions(userId)
      console.log(`Shift logout completed for user ${userId}: ${revokedCount} sessions revoked`)
      return revokedCount > 0
    } catch (error) {
      console.error('Error during shift logout:', error)
      return false
    }
  }
}

export default SessionService
