import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import { redisStorage } from "./redis-storage"
import { databaseHooks } from "./database-hooks"
import { authHooks } from "./auth-hooks"
import { sendEmail, createVerificationEmailTemplate, createPasswordResetEmailTemplate, createWelcomeEmailTemplate } from "./email-service"
import { config, getAllowedOrigins } from "../config/environment.js"
import { getBetterAuthRateLimitConfig } from "./rate-limit-config"

export const validateUserRegistration = (userData: any) => {
    const errors: string[] = [];

    // Validate firstName
    if (!userData.firstName || typeof userData.firstName !== 'string') {
        errors.push('firstName is required and must be a string');
    } else {
        const trimmedFirstName = userData.firstName.trim();
        if (trimmedFirstName.length === 0) {
            errors.push('firstName cannot be empty');
        } else if (trimmedFirstName.length > 50) {
            errors.push('firstName cannot exceed 50 characters');
        } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedFirstName)) {
            errors.push('firstName contains invalid characters');
        }
    }

    // Validate lastName
    if (!userData.lastName || typeof userData.lastName !== 'string') {
        errors.push('lastName is required and must be a string');
    } else {
        const trimmedLastName = userData.lastName.trim();
        if (trimmedLastName.length === 0) {
            errors.push('lastName cannot be empty');
        } else if (trimmedLastName.length > 50) {
            errors.push('lastName cannot exceed 50 characters');
        } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedLastName)) {
            errors.push('lastName contains invalid characters');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const prisma = new PrismaClient()

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  // Trusted origins for CORS and cookie handling
  trustedOrigins: getAllowedOrigins(),
  
  // Enhanced database configuration following Better Auth documentation patterns
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  // Secondary storage with Redis (optional - graceful fallback to database)
  ...(config.REDIS_URL && {
    secondaryStorage: redisStorage,
  }),
  
  // Enhanced database hooks with comprehensive business logic
  databaseHooks,
  
  // Enhanced application hooks following Better Auth documentation patterns
  hooks: authHooks,
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
  rateLimit: getBetterAuthRateLimitConfig(),
  advanced: {
    // Cookie configuration for POS system
    cookiePrefix: "vevurn-pos", // Custom prefix for your POS cookies
    useSecureCookies: process.env.NODE_ENV === 'production', // Force secure cookies in production
    cookies: {
      session_token: {
        name: "vevurn_session", // Custom session cookie name
        attributes: {
          maxAge: 60 * 60 * 12, // 12 hours to match session duration
          sameSite: "strict", // Strict same-site for POS security
          path: "/", // Available across the entire app
        }
      },
      session_data: {
        name: "vevurn_session_data", // Custom session data cookie name
        attributes: {
          maxAge: 5 * 60, // 5 minutes to match cache duration
          sameSite: "strict",
          path: "/",
        }
      },
      dont_remember: {
        name: "vevurn_dont_remember", // Custom remember me cookie
        attributes: {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: "strict",
          path: "/",
        }
      }
    },
    // IP Address handling for POS environments (enhanced for rate limiting)
    ipAddress: {
      // Support multiple IP header formats for different deployment environments
      ipAddressHeaders: [
        "cf-connecting-ip", // Cloudflare
        "x-forwarded-for", // Standard proxy (Better Auth default)
        "x-real-ip", // Nginx
        "x-client-ip", // Alternative header
        "x-forwarded", // Legacy proxy header
        "forwarded-for", // RFC 7239
        "forwarded" // RFC 7239 standard
      ],
    },
  },
  
  // Enhanced email and password authentication following Better Auth documentation
  emailAndPassword: {
    enabled: true,
    // Auto sign in after successful registration (Better Auth pattern)
    autoSignIn: true,
    // Require email verification in production for security
    requireEmailVerification: process.env.NODE_ENV === 'production',
    // Disable sign up if needed (useful for invite-only systems)
    disableSignUp: false,
    // Password security configuration
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Reset password token expiration (1 hour)
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour in seconds
    // Password reset email functionality
    sendResetPassword: async ({ user, url }, _request) => {
      const template = createPasswordResetEmailTemplate(user.name || user.email, url)
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
      console.log(`Password reset email sent to ${user.email}`)
    },
    // Callback after successful password reset
    onPasswordReset: ({ user }, _request) => {
      console.log(`Password successfully reset for user: ${user.email} (ID: ${user.id})`)
      // Here you could add additional logic:
      // - Send confirmation email
      // - Log security event
      // - Notify admin if needed
      // - Invalidate other sessions for security
      return Promise.resolve()
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
      afterDelete: (user, _request) => {
        // Clean up any user-related data that wasn't automatically deleted
        console.log(`User successfully deleted: ${user.email} (ID: ${user.id})`)
        
        // Here you could add cleanup for:
        // - User files in S3
        // - Redis cache entries
        // - External service cleanup
        // - Audit log entry
        return Promise.resolve()
      },
    },
  },
  account: {
    // Account linking for users who want to connect multiple authentication methods
    accountLinking: {
      enabled: true,
      // Allow trusted providers (Google, Microsoft) to link automatically - only if configured
      trustedProviders: [
        ...(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET ? ["google"] : []),
        ...(config.MICROSOFT_CLIENT_ID && config.MICROSOFT_CLIENT_SECRET ? ["microsoft"] : [])
      ],
      // Allow linking accounts with different email addresses (for POS flexibility)
      allowDifferentEmails: true,
      // Update user info when linking new accounts
      updateUserInfoOnLink: true,
      // Allow unlinking all accounts (with caution - only for admin operations)
      allowUnlinkingAll: false,
    },
  },
  // Only include social providers that have credentials configured
  socialProviders: {
    ...(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        mapProfileToUser: (profile) => {
            console.log('=== GOOGLE OAUTH PROFILE DEBUG ===');
            console.log('Raw Google profile:', JSON.stringify(profile, null, 2));
    
            let firstName = '';
            let lastName = '';
    
            // Strategy 1: Use Google's structured fields
            if (profile.given_name) {
                firstName = profile.given_name.trim();
            }
            if (profile.family_name) {
                lastName = profile.family_name.trim();
            }
    
            // Strategy 2: Parse full name if structured fields missing
            if (!firstName && profile.name) {
                const nameParts = profile.name.trim().split(' ').filter(part => part.length > 0);
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
            }
    
            // Strategy 3: Email prefix fallback
            if (!firstName && profile.email) {
                const emailPrefix = profile.email.split('@')[0];
                firstName = emailPrefix.replace(/[^a-zA-Z]/g, '') || 'User';
            }
    
            // Strategy 4: Absolute fallbacks
            if (!firstName.trim()) firstName = 'User';
            if (!lastName.trim()) lastName = 'Account';
    
            const mappedUser = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                name: profile.name || `${firstName} ${lastName}`,
                email: profile.email,
                image: profile.picture,
                // POS-specific defaults
                role: 'cashier',
                isActive: true,
                maxDiscountAllowed: 0,
                canSellBelowMin: false,
                employeeId: null,
            };
    
            console.log('Mapped user data:', JSON.stringify(mappedUser, null, 2));
            console.log('=== END GOOGLE OAUTH DEBUG ===');
    
            return mappedUser;
        }
    }
    }),
    ...(config.MICROSOFT_CLIENT_ID && config.MICROSOFT_CLIENT_SECRET && {
      microsoft: {
        clientId: config.MICROSOFT_CLIENT_ID,
        clientSecret: config.MICROSOFT_CLIENT_SECRET,
        scope: ["user.read"],
        mapProfileToUser: (profile) => {
          return {
            firstName: profile.givenName || profile.displayName?.split(' ')[0] || '',
            lastName: profile.surname || profile.displayName?.split(' ').slice(1).join(' ') || '',
          }
        },
      }
    }),
    ...(config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET && {
      github: {
        clientId: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
        scope: ["user:email"],
        mapProfileToUser: (profile) => {
          const fullName = profile.name || profile.login || ''
          return {
            firstName: fullName.split(' ')[0] || '',
            lastName: fullName.split(' ').slice(1).join(' ') || '',
          }
        },
      }
    }),
  },
})

// Better Auth TypeScript Integration
// Export inferred types following Better Auth documentation patterns

/**
 * Session type including both session and user properties
 * The user property represents the user object type with all additional fields
 * The session property represents the session object type
 */
export type Session = typeof auth.$Infer.Session

/**
 * User type extracted from Session (Better Auth pattern)
 * Includes: role, employeeId, firstName, lastName, isActive, maxDiscountAllowed, canSellBelowMin
 */
export type User = Session['user']

/**
 * Session object type (without user)
 */
export type SessionData = Session['session']

/**
 * Type-safe additional fields configuration
 * Matches the server configuration for client-side inference
 */
export const additionalFieldsConfig = {
  user: {
    role: {
      type: "string" as const,
      required: false,
      input: false // Security: prevent users from setting their own role
    },
    employeeId: {
      type: "string" as const,
      required: false,
      input: false // Security: prevent users from setting their own employee ID
    },
    firstName: {
      type: "string" as const,
      required: true,
      input: true // Allow users to set first name during registration
    },
    lastName: {
      type: "string" as const,
      required: true,
      input: true // Allow users to set last name during registration
    },
    isActive: {
      type: "boolean" as const,
      required: false,
      input: false // Security: only admins can activate/deactivate users
    },
    maxDiscountAllowed: {
      type: "number" as const,
      required: false,
      input: false // Security: only admins can set discount limits
    },
    canSellBelowMin: {
      type: "boolean" as const,
      required: false,
      input: false // Security: only admins can grant below-minimum selling permission
    }
  }
} as const

/**
 * Auth configuration type for type-safe server setup
 */
export type AuthConfig = typeof auth
