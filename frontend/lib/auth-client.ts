/**
 * Better Auth Client for Vevurn POS Frontend
 * 
 * Provides type-safe authentication client with inferred additional fields
 * following Better Auth TypeScript documentation patterns
 */

import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"

// Define additional fields that match the backend configuration
// Following Better Auth documentation for separate client-server projects
const additionalFields = {
  user: {
    role: {
      type: "string" as const,
      required: false
    },
    employeeId: {
      type: "string" as const,
      required: false
    },
    firstName: {
      type: "string" as const,
      required: true
    },
    lastName: {
      type: "string" as const,
      required: true
    },
    isActive: {
      type: "boolean" as const,
      required: false
    },
    maxDiscountAllowed: {
      type: "number" as const,
      required: false
    },
    canSellBelowMin: {
      type: "boolean" as const,
      required: false
    }
  }
} as const

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  basePath: "/api/auth",
  plugins: [
    inferAdditionalFields(additionalFields)
  ],
  fetchOptions: {
    onError: async (ctx) => {
      console.error('Auth request failed:', ctx.error);
      
      // Handle rate limiting errors (429 status code)
      if (ctx.response && ctx.response.status === 429) {
        const retryAfter = ctx.response.headers.get("X-Retry-After");
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        
        console.warn(`Rate limit exceeded. Retry after ${retrySeconds} seconds`);
        
        // You can dispatch a notification here or handle rate limiting globally
        // For example, with a toast notification:
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('auth-rate-limited', { 
            detail: { retryAfter: retrySeconds } 
          });
          window.dispatchEvent(event);
        }
        
        return; // Don't proceed with default error handling for rate limits
      }
      
      // Handle other errors (401, 403, network errors, etc.)
      // You can add global error handling here
      // For example, redirect to login on 401, show toast on network errors, etc.
    },
    onRequest: (ctx) => {
      console.log('Auth request started');
    },
    onSuccess: (ctx) => {
      console.log('Auth request successful');
    }
  }
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  changeEmail,
  deleteUser,
  linkSocial,
  updateUser,
  unlinkAccount,
  listAccounts
} = authClient

/**
 * Enhanced Email & Password authentication helper functions following Better Auth patterns
 */
export const emailAuth = {
  /**
   * Sign up with email and password
   */
  signUpWithEmail: async (data: {
    name: string
    email: string
    password: string
    firstName?: string
    lastName?: string
    image?: string
    callbackURL?: string
  }) => {
    const nameParts = data.name.split(' ')
    const firstName = data.firstName || nameParts[0] || ''
    const lastName = data.lastName || nameParts.slice(1).join(' ') || ''
    
    return await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      firstName,
      lastName,
      image: data.image,
      callbackURL: data.callbackURL || "/dashboard"
    })
  },

  /**
   * Sign in with email and password
   */
  signInWithEmail: async (data: {
    email: string
    password: string
    rememberMe?: boolean
    callbackURL?: string
  }) => {
    return await signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe !== false, // Default to true
      callbackURL: data.callbackURL || "/dashboard"
    })
  },

  /**
   * Sign in with email and password with error handling
   */
  signInWithEmailAndHandleErrors: async (data: {
    email: string
    password: string
    rememberMe?: boolean
    callbackURL?: string
    onEmailNotVerified?: () => void
    onInvalidCredentials?: () => void
    onGenericError?: (error: string) => void
  }) => {
    try {
      return await signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe !== false,
        callbackURL: data.callbackURL || "/dashboard"
      }, {
        onError: (ctx) => {
          if (ctx.error.status === 403) {
            // Email not verified
            data.onEmailNotVerified?.()
          } else if (ctx.error.status === 401) {
            // Invalid credentials
            data.onInvalidCredentials?.()
          } else {
            // Generic error
            data.onGenericError?.(ctx.error.message)
          }
        }
      })
    } catch (error) {
      data.onGenericError?.(error instanceof Error ? error.message : 'Unknown error')
    }
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (data: {
    email: string
    redirectTo?: string
  }) => {
    return await authClient.forgetPassword({
      email: data.email,
      redirectTo: data.redirectTo || "/reset-password"
    })
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: {
    newPassword: string
    token: string
  }) => {
    return await authClient.resetPassword({
      newPassword: data.newPassword,
      token: data.token
    })
  },

  /**
   * Change password (requires current password)
   */
  changePassword: async (data: {
    currentPassword: string
    newPassword: string
    revokeOtherSessions?: boolean
  }) => {
    return await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: data.revokeOtherSessions !== false // Default to true
    })
  },

  /**
   * Send email verification manually
   */
  sendEmailVerification: async (data: {
    email: string
    callbackURL?: string
  }) => {
    return await authClient.sendVerificationEmail({
      email: data.email,
      callbackURL: data.callbackURL || "/dashboard"
    })
  },

  /**
   * Sign out user
   */
  signOut: async (data?: {
    redirectTo?: string
  }) => {
    return await signOut({
      fetchOptions: {
        onSuccess: () => {
          if (data?.redirectTo) {
            window.location.href = data.redirectTo
          }
        }
      }
    })
  }
}

/**
 * Enhanced Google OAuth helper functions following Better Auth patterns
 */
export const googleAuth = {
  /**
   * Sign in with Google using standard OAuth flow
   */
  signInWithGoogle: async (callbackURL?: string) => {
    return await signIn.social({
      provider: "google",
      callbackURL: callbackURL || "/dashboard"
    })
  },

  /**
   * Sign in with Google using ID Token (direct authentication)
   * Useful for mobile apps or when you already have Google tokens
   */
  signInWithGoogleIdToken: async (idToken: string, accessToken?: string) => {
    return await signIn.social({
      provider: "google",
      idToken: {
        token: idToken,
        accessToken: accessToken
      }
    })
  },

  /**
   * Request additional Google scopes (e.g., Drive, Gmail access)
   * This will trigger account linking with additional permissions
   */
  requestAdditionalScopes: async (scopes: string[], callbackURL?: string) => {
    return await linkSocial({
      provider: "google",
      scopes: scopes,
      callbackURL: callbackURL || "/dashboard?scopes-granted=true"
    })
  },

  /**
   * Request Google Drive access
   */
  requestGoogleDriveAccess: async (callbackURL?: string) => {
    return await googleAuth.requestAdditionalScopes([
      "https://www.googleapis.com/auth/drive.file"
    ], callbackURL)
  },

  /**
   * Request Gmail access
   */
  requestGmailAccess: async (callbackURL?: string) => {
    return await googleAuth.requestAdditionalScopes([
      "https://www.googleapis.com/auth/gmail.readonly"
    ], callbackURL)
  },

  /**
   * Request Google Calendar access
   */
  requestCalendarAccess: async (callbackURL?: string) => {
    return await googleAuth.requestAdditionalScopes([
      "https://www.googleapis.com/auth/calendar.readonly"
    ], callbackURL)
  }
}

/**
 * Enhanced Microsoft OAuth helper functions
 */
export const microsoftAuth = {
  /**
   * Sign in with Microsoft using standard OAuth flow
   */
  signInWithMicrosoft: async (callbackURL?: string) => {
    return await signIn.social({
      provider: "microsoft",
      callbackURL: callbackURL || "/dashboard"
    })
  },

  /**
   * Request additional Microsoft scopes
   */
  requestAdditionalScopes: async (scopes: string[], callbackURL?: string) => {
    return await linkSocial({
      provider: "microsoft",
      scopes: scopes,
      callbackURL: callbackURL || "/dashboard?scopes-granted=true"
    })
  },

  /**
   * Request OneDrive access
   */
  requestOneDriveAccess: async (callbackURL?: string) => {
    return await microsoftAuth.requestAdditionalScopes([
      "Files.ReadWrite"
    ], callbackURL)
  },

  /**
   * Request Outlook access
   */
  requestOutlookAccess: async (callbackURL?: string) => {
    return await microsoftAuth.requestAdditionalScopes([
      "Mail.Read"
    ], callbackURL)
  }
}
export type UserRole = 'admin' | 'manager' | 'cashier' | 'user'

// Enhanced user interface for POS operations
export interface POSUser {
  id: string
  email: string
  emailVerified: boolean | null
  name: string | null
  createdAt: Date
  updatedAt: Date
  image?: string | null
  role: UserRole
  employeeId: string | null
  firstName: string
  lastName: string
  isActive: boolean
  maxDiscountAllowed: number
  canSellBelowMin: boolean
}

// Type guard for POS user
export function isPOSUser(user: any): user is POSUser {
  return user && typeof user.role === 'string' && typeof user.firstName === 'string'
}

// Permission helper functions
export function canApplyDiscount(user: POSUser, discountPercent: number): boolean {
  return user.isActive && discountPercent <= user.maxDiscountAllowed
}

export function canSellBelowMinimum(user: POSUser): boolean {
  return user.isActive && user.canSellBelowMin
}

export function hasAdminAccess(user: POSUser): boolean {
  return user.isActive && user.role === 'admin'
}

export function hasManagerAccess(user: POSUser): boolean {
  return user.isActive && (user.role === 'admin' || user.role === 'manager')
}

// Auth client instance type for advanced usage
export type AuthClientType = typeof authClient

// Error handling based on Better Auth documentation
type ErrorTypes = Partial<
  Record<
    keyof typeof authClient.$ERROR_CODES,
    {
      en: string;
      fr: string; // Adding French for Rwanda support
    }
  >
>;

export const errorMessages = {
  USER_NOT_FOUND: {
    en: "Account not found",
    fr: "Compte introuvable",
  },
  INVALID_PASSWORD: {
    en: "Invalid email or password",
    fr: "Email ou mot de passe invalide",
  },
  INVALID_EMAIL: {
    en: "Invalid email format",
    fr: "Format d'email invalide",
  },
  FAILED_TO_CREATE_USER: {
    en: "Failed to create account. Please try again",
    fr: "Échec de la création du compte. Veuillez réessayer",
  },
  FAILED_TO_CREATE_SESSION: {
    en: "Failed to sign in. Please try again",
    fr: "Échec de la connexion. Veuillez réessayer",
  }
} satisfies ErrorTypes;

export const getErrorMessage = (code: string, lang: "en" | "fr" = "en"): string => {
  // Handle common auth errors with Better Auth error codes
  if (code in errorMessages) {
    return errorMessages[code as keyof typeof errorMessages][lang];
  }
  
  // Handle generic error cases
  const genericErrors: Record<string, { en: string; fr: string }> = {
    'USER_ALREADY_EXISTS': {
      en: "Account with this email already exists",
      fr: "Un compte avec cet email existe déjà",
    },
    'EMAIL_NOT_VERIFIED': {
      en: "Please verify your email before signing in",
      fr: "Veuillez vérifier votre email avant de vous connecter",
    },
    'NETWORK_ERROR': {
      en: "Network error. Please check your connection",
      fr: "Erreur réseau. Veuillez vérifier votre connexion",
    },
    'RATE_LIMIT': {
      en: "Too many requests. Please try again later",
      fr: "Trop de requêtes. Veuillez réessayer plus tard",
    }
  };
  
  if (code in genericErrors) {
    return genericErrors[code][lang];
  }
  
  // Fallback to generic message
  return lang === "fr" ? "Une erreur s'est produite" : "An error occurred";
};

// Helper function for handling auth errors with toast notifications
export const handleAuthError = (error: any, lang: "en" | "fr" = "en") => {
  if (error?.code) {
    return getErrorMessage(error.code, lang);
  }
  if (error?.message) {
    return error.message;
  }
  return getErrorMessage("NETWORK_ERROR", lang);
};

// Better Auth TypeScript Integration for Client
// Export inferred types following Better Auth documentation patterns

/**
 * Session type inferred from auth client
 * Includes both session and user properties with all additional fields
 */
export type Session = typeof authClient.$Infer.Session

/**
 * User type with all additional fields properly inferred
 * Includes: role, employeeId, firstName, lastName, isActive, maxDiscountAllowed, canSellBelowMin
 */
export type User = Session['user']

/**
 * Session data type (session object without user)
 */
export type SessionData = Session['session']

/**
 * Re-export auth client as default for convenience
 */
export default authClient

/**
 * Additional fields configuration type for type safety
 */
export type AdditionalFieldsConfig = typeof additionalFields
