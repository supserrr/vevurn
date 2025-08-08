// lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { bearer } from "better-auth/plugins"

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  },
  plugins: [
    bearer(),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "cashier",
      },
      employeeId: {
        type: "string",
        required: false,
      },
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
      maxDiscountAllowed: {
        type: "number",
        required: false,
        defaultValue: 5.0,
      },
      canSellBelowMin: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  socialProviders: {
    // Add social providers if needed
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.BACKEND_URL || "http://localhost:3001",
  ],
  logger: {
    level: process.env.NODE_ENV === "production" ? "error" : "info",
    disabled: false,
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },
  advanced: {
    generateId: () => {
      // Generate UUID v4
      return crypto.randomUUID()
    },
    crossSubDomainCookies: {
      enabled: false, // Set to true if using subdomains
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || "http://localhost:3001",
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
