import { APIError } from "better-auth/api"

// Database hooks for Better Auth
export const databaseHooks = {
  user: {
    create: {
      before: async (user: any, ctx: any) => {
        // Check if this is an OAuth signup (no password provided)
        const isOAuthSignup = !ctx.body?.password && ctx.body?.provider
        
        // Validate employee ID uniqueness if provided
        if (user.employeeId && !user.employeeId.match(/^EMP-\d{4}$/)) {
          throw new APIError("BAD_REQUEST", {
            message: "Employee ID must follow format EMP-XXXX (e.g., EMP-1001)",
          })
        }

        // For OAuth signups, firstName and lastName might come from profile mapping
        // For email/password signups, they are required
        if (!isOAuthSignup && (!user.firstName || !user.lastName)) {
          throw new APIError("BAD_REQUEST", {
            message: "First name and last name are required",
          })
        }

        // For OAuth users, try to extract name from the 'name' field if firstName/lastName are missing
        if (isOAuthSignup && (!user.firstName || !user.lastName) && user.name) {
          const nameParts = user.name.split(' ')
          user.firstName = user.firstName || nameParts[0] || ''
          user.lastName = user.lastName || nameParts.slice(1).join(' ') || ''
        }

        // Generate employee ID if not provided
        if (!user.employeeId) {
          const timestamp = Date.now().toString().slice(-4)
          user.employeeId = `EMP-${timestamp}`
        }

        // Set default values for POS-specific fields
        return {
          data: {
            ...user,
            role: user.role || "cashier",
            isActive: user.isActive ?? true,
            maxDiscountAllowed: user.maxDiscountAllowed || 0,
            canSellBelowMin: user.canSellBelowMin || false,
          },
        }
      },
      after: async (user: any) => {
        const authMethod = user.accounts?.[0]?.providerId === 'credential' ? 'Email/Password' : 'OAuth'
        const oauthProvider = user.accounts?.[0]?.providerId !== 'credential' ? user.accounts?.[0]?.providerId : null
        
        console.log(`New user created: ${user.name} (${user.employeeId}) with role: ${user.role}`)
        console.log(`Authentication method: ${authMethod}${oauthProvider ? ` (${oauthProvider})` : ''}`)
        
        // Here you could add additional logic like:
        // - Creating a welcome notification
        // - Sending an employee handbook email (for email verified OAuth users)
        // - Setting up default permissions
        // - Creating audit log entry
        // - Notifying admins of new OAuth users specifically
      },
    },
    update: {
      before: async (data: any, ctx: any) => {
        // Prevent users from changing their own role or permissions
        if (ctx.context.session && data.role && data.userId === ctx.context.session.userId) {
          throw new APIError("FORBIDDEN", {
            message: "You cannot modify your own role or permissions",
          })
        }

        // Validate employee ID format if being updated
        if (data.employeeId && !data.employeeId.match(/^EMP-\d{4}$/)) {
          throw new APIError("BAD_REQUEST", {
            message: "Employee ID must follow format EMP-XXXX (e.g., EMP-1001)",
          })
        }

        return { data }
      },
      after: async (user: any, ctx: any) => {
        if (ctx.context.session) {
          console.log(`User ${user.name} updated by ${ctx.context.session.userId}`)
          
          // Create audit log for user updates
          // This is where you'd typically log to your audit system
        }
      },
    },
  },
  session: {
    create: {
      before: async (session: any, _ctx: any) => {
        // Log session creation for security monitoring
        console.log(`New session created for user: ${session.userId}`)
        console.log(`IP: ${session.ipAddress}, User Agent: ${session.userAgent}`)
        
        return { data: session }
      },
    },
  },
}
