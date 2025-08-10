import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { redisStorage } from "./redis-storage"
import { databaseHooks } from "./database-hooks"
import { sendEmail, createVerificationEmailTemplate, createPasswordResetEmailTemplate, createWelcomeEmailTemplate } from "./email-service"
import { config, getAllowedOrigins } from "../config/environment"

const prisma = new PrismaClient()

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secondaryStorage: redisStorage,
  databaseHooks,
  session: {
    // Session duration: 12 hours for POS environments (staff shifts)
    expiresIn: 60 * 60 * 12, // 12 hours in seconds
    // Update session every 2 hours to maintain activity
    updateAge: 60 * 60 * 2, // 2 hours in seconds
    // Fresh session requirement: 30 minutes for sensitive operations
    freshAge: 60 * 30, // 30 minutes for password changes, account linking, etc.
    // Cookie caching for performance optimization
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes cache duration
    },
    // Keep session refresh enabled for active users
    disableSessionRefresh: false,
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production', // Enable in production, disable in development
    window: 60, // 1 minute window
    max: 100, // 100 requests per minute (generous for POS operations)
    storage: "secondary-storage", // Use Redis for distributed rate limiting
    customRules: {
      // Stricter limits for authentication endpoints
      "/sign-in/email": {
        window: 60, // 1 minute
        max: 5, // 5 login attempts per minute per IP
      },
      "/sign-up/email": {
        window: 300, // 5 minutes
        max: 3, // Only 3 signup attempts per 5 minutes
      },
      "/reset-password": {
        window: 300, // 5 minutes
        max: 3, // Only 3 password reset requests per 5 minutes
      },
      "/verify-email": {
        window: 300, // 5 minutes
        max: 5, // 5 verification attempts per 5 minutes
      },
      // Social OAuth endpoints (slightly more lenient)
      "/sign-in/social/*": {
        window: 60,
        max: 10, // 10 OAuth attempts per minute
      },
      // Account linking (less frequent operation)
      "/link-social": {
        window: 300, // 5 minutes
        max: 5, // 5 link attempts per 5 minutes
      },
      // Password change (sensitive operation)
      "/change-password": {
        window: 300, // 5 minutes
        max: 3, // Only 3 password changes per 5 minutes
      },
      // Session management
      "/sign-out": {
        window: 60,
        max: 20, // Allow frequent sign-outs (shift changes)
      },
      // POS-specific: Allow higher limits for operational endpoints
      "/session": {
        window: 60,
        max: 200, // High limit for session checks during POS operations
      },
    },
  },
  advanced: {
    ipAddress: {
      // Support multiple IP header formats for different deployment environments
      ipAddressHeaders: [
        "cf-connecting-ip", // Cloudflare
        "x-forwarded-for", // Standard proxy
        "x-real-ip", // Nginx
        "x-client-ip", // Alternative
        "x-forwarded", // Legacy
      ],
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: process.env.NODE_ENV === 'production', // Require verification in production
    sendResetPassword: async ({ user, url }, _request) => {
      const template = createPasswordResetEmailTemplate(user.name || user.email, url)
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }, _request) => {
      const template = createVerificationEmailTemplate(user.name || user.email, url)
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
    },
    afterEmailVerification: async (user, _request) => {
      console.log(`Email verified for user: ${user.name} (${user.email}) - Employee ID: ${(user as any).employeeId}`)
      
      // Send welcome email after successful verification
      try {
        const userWithDetails = user as any
        const template = createWelcomeEmailTemplate(
          user.name || user.email, 
          userWithDetails.employeeId || 'N/A', 
          userWithDetails.role || 'cashier'
        )
        
        await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
        
        console.log(`Welcome email sent to ${user.email}`)
      } catch (error) {
        console.error('Failed to send welcome email:', error)
        // Don't throw error - verification should still succeed even if email fails
      }
      
      // Here you could add additional logic like:
      // - Grant access to specific features based on role
      // - Create audit log entry
      // - Notify admins of new verified users
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "cashier",
        input: false, // Don't allow user to set role during signup
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
    // Email change functionality for POS user management
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }, _request) => {
        const { sendEmail, createEmailChangeVerificationTemplate } = await import('./email-service')
        const template = createEmailChangeVerificationTemplate(
          user.name || user.email,
          user.email,
          newEmail,
          url
        )
        
        await sendEmail({
          to: user.email, // Send to current email for security
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
        
        console.log(`Email change verification sent for user ${user.email} -> ${newEmail}`)
      },
    },
    // User deletion functionality for GDPR compliance
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }, _request) => {
        const { sendEmail, createAccountDeletionTemplate } = await import('./email-service')
        const template = createAccountDeletionTemplate(
          user.name || user.email,
          url
        )
        
        await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
        
        console.log(`Account deletion verification sent to ${user.email}`)
      },
      beforeDelete: async (user, _request) => {
        // Prevent deletion of admin accounts
        const userData = user as any
        if (userData.role === 'admin') {
          const { APIError } = await import('better-auth/api')
          throw new APIError("BAD_REQUEST", {
            message: "Admin accounts cannot be deleted. Please contact system administrator.",
          })
        }
        
        // Log the deletion attempt for audit purposes
        console.log(`User deletion initiated for: ${user.email} (ID: ${user.id})`)
      },
      afterDelete: async (user, _request) => {
        // Clean up any user-related data that wasn't automatically deleted
        console.log(`User successfully deleted: ${user.email} (ID: ${user.id})`)
        
        // Here you could add cleanup for:
        // - User files in S3
        // - Redis cache entries
        // - External service cleanup
        // - Audit log entry
      },
    },
  },
  account: {
    // Account linking for users who want to connect multiple authentication methods
    accountLinking: {
      enabled: true,
      // Allow trusted providers (Google, Microsoft) to link automatically
      trustedProviders: ["google", "microsoft"],
      // Allow linking accounts with different email addresses (for POS flexibility)
      allowDifferentEmails: true,
      // Update user info when linking new accounts
      updateUserInfoOnLink: true,
      // Allow unlinking all accounts (with caution - only for admin operations)
      allowUnlinkingAll: false,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["email", "profile"],
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name || profile.name?.split(' ')[0] || '',
          lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
        }
      },
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      scope: ["openid", "profile", "email"],
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.givenName || profile.name?.split(' ')[0] || '',
          lastName: profile.surname || profile.name?.split(' ').slice(1).join(' ') || '',
        }
      },
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ["user:email"],
      mapProfileToUser: (profile) => {
        const nameParts = (profile.name || '').split(' ')
        return {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
        }
      },
    },
  },
  trustedOrigins: getAllowedOrigins(),
})

export type Session = typeof auth.$Infer.Session
