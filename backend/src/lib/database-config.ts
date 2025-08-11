// Enhanced database configuration following Better Auth documentation patterns
// Reference: https://better-auth.com/docs/concepts/database

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Database configuration with custom field mappings
 * Following Better Auth documentation for customizing table and column names
 */
export const databaseConfig = {
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Custom table names and field mappings
  // Better Auth will map these to your actual database schema
  user: {
    modelName: "users", // Maps to your `users` table
    fields: {
      // Core Better Auth fields with custom mappings
      id: "id",
      name: "name", 
      email: "email",
      emailVerified: "emailVerified",
      image: "image",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    // Additional POS-specific fields that will be type-inferred
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "cashier",
        input: false, // Admin-controlled field
      },
      employeeId: {
        type: "string",
        required: false,
        input: true, // Can be provided during signup (for admin-created accounts)
      },
      firstName: {
        type: "string",
        required: true,
        input: true,
      },
      lastName: {
        type: "string",
        required: true,
        input: true,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false, // Admin-controlled field
      },
      maxDiscountAllowed: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false, // Admin-controlled field
      },
      canSellBelowMin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // Admin-controlled field
      },
    },
  },

  session: {
    modelName: "sessions", // Maps to your `sessions` table
    fields: {
      id: "id",
      userId: "userId",
      token: "token", // Your schema uses @map("sessionToken")
      expiresAt: "expiresAt", // Your schema uses @map("expires")
      ipAddress: "ipAddress",
      userAgent: "userAgent",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },

  account: {
    modelName: "accounts", // Maps to your `accounts` table
    fields: {
      id: "id",
      userId: "userId",
      accountId: "accountId", // Your schema uses @map("providerAccountId")
      providerId: "providerId", // Your schema uses @map("provider")
      accessToken: "accessToken",
      refreshToken: "refreshToken",
      accessTokenExpiresAt: "accessTokenExpiresAt",
      refreshTokenExpiresAt: "refreshTokenExpiresAt",
      scope: "scope",
      idToken: "idToken",
      password: "password",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },

  verification: {
    modelName: "verification_tokens", // Maps to your `verification_tokens` table
    fields: {
      id: "id",
      identifier: "identifier",
      value: "value", // Your schema uses @map("token")
      expiresAt: "expiresAt", // Your schema uses @map("expires")
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },

  // Advanced database configuration options
  advanced: {
    database: {
      // Better Auth will generate IDs by default
      // Set to false if your database auto-generates IDs
      generateId: true,
      
      // Custom ID generation function (optional)
      // generateId: () => `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
  },
}

/**
 * Database utilities for common operations
 * Following Better Auth patterns for database management
 */
export class DatabaseManager {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  /**
   * Health check for database connection
   * Following Better Auth documentation patterns
   */
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "postgresql",
      }
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "postgresql",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get database statistics for monitoring
   */
  async getStatistics() {
    try {
      const [userCount, sessionCount, accountCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.session.count(),
        this.prisma.account.count(),
      ])

      return {
        users: userCount,
        sessions: sessionCount,
        accounts: accountCount,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`Failed to get database statistics: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Clean up expired sessions and verifications
   * Maintenance operation following Better Auth patterns
   */
  async cleanupExpiredRecords() {
    try {
      const now = new Date()
      
      const [expiredSessions, expiredVerifications] = await Promise.all([
        this.prisma.session.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        }),
        this.prisma.verification.deleteMany({
          where: {
            expiresAt: {
              lt: now,
            },
          },
        }),
      ])

      return {
        sessionsDeleted: expiredSessions.count,
        verificationsDeleted: expiredVerifications.count,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`Failed to cleanup expired records: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get active sessions by user (for session management)
   */
  async getActiveSessions(userId: string) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return sessions
    } catch (error) {
      throw new Error(`Failed to get active sessions: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Disconnect database (for graceful shutdown)
   */
  async disconnect() {
    await this.prisma.$disconnect()
  }
}

export { prisma }
export default new DatabaseManager()
