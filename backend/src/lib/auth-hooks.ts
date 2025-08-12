/**
 * Enhanced Better Auth Hooks Implementation
 * Following Better Auth documentation patterns for hooks
 * Reference: https://better-auth.com/docs/concepts/hooks
 */

import { createAuthMiddleware, APIError } from "better-auth/api"

/**
 * Combined hooks for Better Auth following documentation patterns
 * Includes before and after hook functionality
 */
export const authHooks = {
  before: createAuthMiddleware(async (ctx) => {
    // Enhanced validation for POS system
    if (ctx.path === "/sign-up/email") {
      const body = ctx.body as any
      const email = body?.email
      const role = body?.role || 'cashier'
      
      // Add debugging to see what Better Auth is actually receiving
      console.log('=== BACKEND VALIDATION DEBUG ===');
      console.log('Received body keys:', Object.keys(body || {}));
      console.log('firstName value:', JSON.stringify(body?.firstName));
      console.log('lastName value:', JSON.stringify(body?.lastName));
      console.log('name value:', JSON.stringify(body?.name));
      console.log('=== END BACKEND DEBUG ===');
      
      // Better Auth might use 'name' field, so let's check both patterns
      const firstName = body?.firstName;
      const lastName = body?.lastName;
      const name = body?.name;
      
      // If Better Auth processes the name field, extract from there
      let extractedFirstName = firstName;
      let extractedLastName = lastName;
      
      if (!firstName && !lastName && name) {
        const nameParts = name.split(' ');
        extractedFirstName = nameParts[0];
        extractedLastName = nameParts.slice(1).join(' ');
        console.log('Extracted from name field - firstName:', extractedFirstName, 'lastName:', extractedLastName);
      }
      
      // Enhanced validation with better error messages
      if (!extractedFirstName || extractedFirstName.trim().length === 0) {
        throw new APIError("BAD_REQUEST", {
          message: "First name is required and cannot be empty",
        })
      }
      
      if (!extractedLastName || extractedLastName.trim().length === 0) {
        throw new APIError("BAD_REQUEST", {
          message: "Last name is required and cannot be empty", 
        })
      }
      
      // Corporate email validation for admin accounts
      if (role === 'admin') {
        const corporateDomains = ['vevurn.com', 'company.internal']
        const emailDomain = email?.split('@')[1]?.toLowerCase()
        
        if (corporateDomains.length > 0 && !corporateDomains.includes(emailDomain)) {
          throw new APIError("BAD_REQUEST", {
            message: `Admin accounts must use corporate email domains: ${corporateDomains.join(', ')}`,
          })
        }
      }
      
      // Employee ID validation if provided
      const employeeId = body?.employeeId
      if (employeeId && !employeeId.match(/^EMP-\d{4}$/)) {
        throw new APIError("BAD_REQUEST", {
          message: "Employee ID must follow format EMP-XXXX (e.g., EMP-1001)",
        })
      }
      
      console.log(`📝 Sign-up validation passed for: ${email} (${role})`)
    }
    
    // Sign-in attempt logging and validation
    if (ctx.path === "/sign-in/email") {
      const body = ctx.body as any
      const email = body?.email
      console.log(`🔐 Sign-in attempt for: ${email}`)
    }
    
    // Password change validation
    if (ctx.path === "/change-password") {
      const body = ctx.body as any
      const currentPassword = body?.currentPassword
      const newPassword = body?.newPassword
      
      if (!currentPassword || !newPassword) {
        throw new APIError("BAD_REQUEST", {
          message: "Both current and new passwords are required",
        })
      }
      
      // Enhanced password validation for POS system
      if (newPassword.length < 8) {
        throw new APIError("BAD_REQUEST", {
          message: "Password must be at least 8 characters long",
        })
      }
      
      console.log(`🔒 Password change request validated`)
    }
    
    // OAuth sign-in preprocessing
    if (ctx.path.startsWith("/sign-in/social/")) {
      const provider = ctx.path.split('/')[3] // Extract provider from path
      console.log(`🌐 OAuth sign-in attempt with: ${provider}`)
    }
  }),
  
  after: createAuthMiddleware(async (ctx) => {
    // User registration success handling (following documentation example)
    if (ctx.path.startsWith("/sign-up")) {
      const newSession = ctx.context.newSession
      
      if (newSession) {
        const user = newSession.user
        console.log(`✅ New user registered: ${user.name} (${user.email})`)
        
        // Enhanced welcome process for POS system
        try {
          // Audit logging for new user registration
          console.log(`📊 Audit Log: User registered - ID: ${user.id}, Role: ${(user as any).role}, Employee ID: ${(user as any).employeeId}`)
          
          // Notification for admin user registrations
          if ((user as any).role === 'admin') {
            console.log(`🚨 ALERT: New admin user registered: ${user.email} - Manual review recommended`)
          }
          
        } catch (error) {
          console.error('❌ Error in post-registration processing:', error)
          // Don't throw error - registration should still succeed
        }
      }
    }
    
    // Successful sign-in handling
    if (ctx.path.startsWith("/sign-in")) {
      const newSession = ctx.context.newSession
      
      if (newSession) {
        const user = newSession.user
        console.log(`🔐 User signed in: ${user.name} (${user.email})`)
        
        // POS-specific sign-in processing
        const userRole = (user as any).role || 'cashier'
        const employeeId = (user as any).employeeId || 'N/A'
        
        console.log(`👤 Session created for ${userRole} (${employeeId})`)
        
        // Track sign-in for POS analytics
        console.log(`📊 Audit Log: User sign-in - ID: ${user.id}, Role: ${userRole}`)
        
        // Set custom cookies for POS system context
        try {
          ctx.setCookie("pos-user-role", userRole, {
            maxAge: 60 * 60 * 12, // 12 hours
            httpOnly: false, // Allow frontend access
            sameSite: "strict",
          })
          
          if (employeeId !== 'N/A') {
            ctx.setCookie("pos-employee-id", employeeId, {
              maxAge: 60 * 60 * 12, // 12 hours
              httpOnly: false, // Allow frontend access
              sameSite: "strict",
            })
          }
          
          console.log(`🍪 POS context cookies set for: ${userRole} (${employeeId})`)
        } catch (error) {
          console.error('❌ Error setting POS cookies:', error)
        }
      }
    }
    
    // Password change success handling
    if (ctx.path === "/change-password") {
      const session = ctx.context.session
      if (session) {
        console.log(`🔒 Password changed for user: ${session.user.id}`)
        console.log(`📊 Audit Log: Password changed - User ID: ${session.user.id}`)
      }
    }
    
    // OAuth account linking success
    if (ctx.path.startsWith("/link-social")) {
      const session = ctx.context.session
      if (session) {
        console.log(`🔗 OAuth account linked for user: ${session.user.id}`)
        console.log(`📊 Audit Log: OAuth account linked - User ID: ${session.user.id}`)
      }
    }
    
    // Clear custom cookies on sign-out
    if (ctx.path === "/sign-out") {
      try {
        ctx.setCookie("pos-user-role", "", { maxAge: 0 })
        ctx.setCookie("pos-employee-id", "", { maxAge: 0 })
        console.log(`🍪 POS context cookies cleared`)
      } catch (error) {
        console.error('❌ Error clearing POS cookies:', error)
      }
    }
  }),
}

/**
 * Utility functions for Better Auth context access
 * Following documentation patterns for context usage
 */
export const createContextUtility = () => {
  return createAuthMiddleware(async (ctx) => {
    // Access Better Auth utilities (following documentation patterns)
    const utilities = {
      generateId: (model: string) => ctx.context.generateId({ model }),
      hashPassword: (password: string) => ctx.context.password.hash(password),
      verifyPassword: (data: { password: string, hash: string }) => ctx.context.password.verify(data),
      secret: ctx.context.secret,
      cookies: ctx.context.authCookies,
    }
    
    // Example usage of utilities
    console.log(`🔧 Better Auth utilities available for ${ctx.path}`)
    
    return utilities
  })
}

/**
 * Enhanced error handling following documentation patterns
 */
export const createErrorHandler = () => {
  return createAuthMiddleware(async (ctx) => {
    const returned = ctx.context.returned
    
    if (returned instanceof APIError) {
      console.error(`❌ API Error [${ctx.path}]: ${returned.status} - ${returned.message}`)
      
      // Enhanced error messages for POS users
      if (ctx.path === "/sign-in/email" && returned.message.includes("Invalid")) {
        return ctx.json({
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password. Please check your credentials or contact your supervisor.",
        }, { status: 401 })
      }
      
      if (ctx.path === "/sign-up/email" && returned.message.includes("already exists")) {
        return ctx.json({
          error: "USER_ALREADY_EXISTS", 
          message: "An account with this email already exists. Please use a different email or contact your administrator.",
        }, { status: 400 })
      }
      
      // Return the original error for unhandled cases
      return returned
    }
    
    // Continue with normal flow
    return ctx.context.next()
  })
}

/**
 * Redirect hooks for POS-specific flows
 * Following documentation patterns for redirects
 */
export const createRedirectHandler = () => {
  return createAuthMiddleware(async (ctx) => {
    // Redirect new users to onboarding based on role
    if (ctx.path.startsWith("/sign-up") && ctx.context.newSession) {
      const user = ctx.context.newSession.user
      const userRole = (user as any)?.role || 'cashier'
      
      // Role-based onboarding redirects
      if (userRole === 'admin') {
        console.log(`🔀 Redirecting admin user to admin onboarding`)
        return ctx.redirect("/admin/onboarding")
      } else if (userRole === 'supervisor') {
        console.log(`🔀 Redirecting supervisor to supervisor onboarding`)
        return ctx.redirect("/supervisor/onboarding")  
      } else {
        console.log(`🔀 Redirecting cashier to cashier onboarding`)
        return ctx.redirect("/cashier/onboarding")
      }
    }
    
    // Continue with normal flow if no redirect needed
    return ctx.context.next()
  })
}
