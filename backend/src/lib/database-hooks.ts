import { APIError } from "better-auth/api"

/**
 * Enhanced Database hooks for Better Auth with comprehensive POS business logic
 * Following Better Auth documentation patterns for database hooks
 * Reference: https://better-auth.com/docs/concepts/database#database-hooks
 */

export const databaseHooks = {
  user: {
    create: {
      before: async (user: any, ctx: any) => {
        console.log('🔍 Database hook - before user creation:', JSON.stringify(user, null, 2));
        
        // Import and use the validation function from auth.ts
        const { validateUserRegistration } = await import('./auth')
        
        // Validate and clean the user data
        const validation = validateUserRegistration(user);
        
        if (!validation.isValid) {
          console.error('❌ User validation failed:', validation.errors);
          throw new APIError("BAD_REQUEST", {
            message: `Validation failed: ${validation.errors.join(', ')}`,
          });
        }
        
        // Use the cleaned data
        const cleanedUser = validation.cleanedData;
        
        // Ensure required fields are present
        if (!cleanedUser.firstName || !cleanedUser.lastName) {
          throw new APIError("BAD_REQUEST", {
            message: 'firstName and lastName are required and cannot be empty',
          });
        }
        
        console.log('✅ User validation passed, cleaned data:', JSON.stringify(cleanedUser, null, 2));
        
        console.log('🔍 OAuth user creation attempt:', {
          email: cleanedUser.email,
          timestamp: new Date().toISOString(),
          provider: ctx.body?.provider || 'email',
          role: cleanedUser.role || 'cashier'
        });
        
        // Check if this is an OAuth signup (no password provided)
        const isOAuthSignup = !ctx.body?.password && ctx.body?.provider
        console.log(`🔍 Is OAuth signup: ${isOAuthSignup}`);

        // Business rule: Only admin users can create admin accounts
        if (cleanedUser.role === 'admin' && ctx.context?.session) {
          const currentUser = ctx.context.session.user;
          if (currentUser?.role !== 'admin') {
            throw new APIError("FORBIDDEN", {
              message: "Only administrators can create admin accounts",
            });
          }
        }

        // For OAuth signups, firstName and lastName should already be cleaned by validation
        // For email/password signups, they are also validated above

        // Generate employee ID if not provided (business logic)
        if (!cleanedUser.employeeId) {
          const timestamp = Date.now().toString().slice(-4)
          cleanedUser.employeeId = `EMP-${timestamp}`
        }

        // Validate POS-specific business rules
        if (cleanedUser.maxDiscountAllowed && cleanedUser.maxDiscountAllowed > 50) {
          throw new APIError("BAD_REQUEST", {
            message: "Maximum discount cannot exceed 50%",
          });
        }

        // Email domain validation for corporate accounts
        const corporateDomains = ['vevurn.com', 'company.internal']
        const emailDomain = cleanedUser.email.split('@')[1]?.toLowerCase()
        
        if (cleanedUser.role === 'admin' && corporateDomains.length > 0 && !corporateDomains.includes(emailDomain)) {
          console.warn(`⚠️ Admin account created with non-corporate email: ${cleanedUser.email}`)
        }

        // Set default values for POS-specific fields (following Better Auth patterns)
        const enhancedUser = {
          ...cleanedUser,
          role: cleanedUser.role || "cashier",
          isActive: cleanedUser.isActive ?? true,
          maxDiscountAllowed: cleanedUser.maxDiscountAllowed || 0,
          canSellBelowMin: cleanedUser.canSellBelowMin || false,
        }

        // Following documentation example: return data object to replace original payload
        return {
          data: enhancedUser,
        }
      },
      after: async (user: any, ctx: any) => {
        const authMethod = user.accounts?.[0]?.providerId === 'credential' ? 'Email/Password' : 'OAuth'
        const oauthProvider = user.accounts?.[0]?.providerId !== 'credential' ? user.accounts?.[0]?.providerId : null
        
        console.log(`✅ New user created: ${user.name} (${user.employeeId}) with role: ${user.role}`)
        console.log(`🔐 Authentication method: ${authMethod}${oauthProvider ? ` (${oauthProvider})` : ''}`)
        
        // Enhanced after-creation logic following Better Auth patterns
        try {
          // Send welcome notification for OAuth users (they have verified emails)
          if (oauthProvider && user.emailVerified) {
            console.log(`📧 Welcome email queued for OAuth user: ${user.email}`)
          }

          // Notify administrators of new admin accounts
          if (user.role === 'admin') {
            console.log(`🚨 New admin account created: ${user.email} - Manual review recommended`)
          }

          // POS-specific: Initialize default permissions based on role
          const rolePermissions = {
            cashier: ['pos.sell', 'pos.view_inventory'],
            supervisor: ['pos.sell', 'pos.view_inventory', 'pos.manage_staff', 'pos.reports'],
            admin: ['pos.*', 'admin.*'],
          }
          
          const permissions = rolePermissions[user.role as keyof typeof rolePermissions] || rolePermissions.cashier
          console.log(`🔑 Initialized permissions for ${user.role}: ${permissions.join(', ')}`)
          
        } catch (error) {
          // Don't fail user creation if after-hooks have issues
          console.error('❌ Error in user creation after-hook:', error)
        }
      },
    },
    update: {
      before: async (data: any, ctx: any) => {
        console.log(`🔄 Updating user: ${data.userId || 'unknown'}`)

        // Access current session from context (following documentation pattern)
        if (ctx.context.session) {
          console.log("👤 User update initiated by:", ctx.context.session.userId);
        }

        // Prevent users from changing their own role or permissions (security rule)
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

        // Business rule: Only admins can change sensitive fields
        const sensitiveFields = ['role', 'isActive', 'maxDiscountAllowed', 'canSellBelowMin']
        const hasSensitiveUpdates = sensitiveFields.some(field => Object.prototype.hasOwnProperty.call(data, field))
        
        if (hasSensitiveUpdates && ctx.context.session?.user?.role !== 'admin') {
          throw new APIError("FORBIDDEN", {
            message: "Only administrators can modify role and permission settings",
          })
        }

        // Validate discount limits
        if (data.maxDiscountAllowed && data.maxDiscountAllowed > 50) {
          throw new APIError("BAD_REQUEST", {
            message: "Maximum discount cannot exceed 50%",
          });
        }

        return { data }
      },
      after: async (user: any, ctx: any) => {
        console.log(`✅ User updated: ${user.name} (${user.employeeId})`)
        
        // Log sensitive field changes
        const sensitiveFields = ['role', 'isActive', 'maxDiscountAllowed', 'canSellBelowMin']
        const updatedSensitiveFields = sensitiveFields.filter(field => 
          ctx.body && Object.prototype.hasOwnProperty.call(ctx.body, field)
        )
        
        if (updatedSensitiveFields.length > 0) {
          console.log(`🔐 Sensitive fields updated: ${updatedSensitiveFields.join(', ')}`)
        }
      },
    },
  },

  session: {
    create: {
      before: async (session: any, ctx: any) => {
        // Enhanced session creation with POS-specific logic
        console.log(`🔐 Creating session for user: ${session.userId}`)
        
        // Note: Prisma access would need to be provided via context in a real implementation
        // This is a conceptual example following Better Auth patterns
        
        return { data: session }
      },
      after: async (session: any, ctx: any) => {
        console.log(`✅ Session created: ${session.id} for user ${session.userId}`)
        
        // Track session creation for monitoring
        try {
          console.log(`📊 Session tracking: IP ${session.ipAddress}, Agent: ${session.userAgent?.substring(0, 50)}...`)
        } catch (error) {
          console.error('❌ Failed to log session creation:', error)
        }
      },
    },
  },

  account: {
    create: {
      before: async (account: any, ctx: any) => {
        console.log(`🔗 Creating account: ${account.providerId} for user ${account.userId}`)
        
        // OAuth account validation
        if (account.providerId !== 'credential') {
          console.log(`🌐 OAuth account: ${account.providerId} (${account.accountId})`)
          
          // Business rule: Limit OAuth providers for certain roles
          if (ctx.user && ctx.user.role === 'admin') {
            const allowedProviders = ['google', 'microsoft']
            if (!allowedProviders.includes(account.providerId)) {
              throw new APIError("FORBIDDEN", {
                message: `Admin accounts can only use the following providers: ${allowedProviders.join(', ')}`,
              })
            }
          }
        }

        return { data: account }
      },
      after: async (account: any, ctx: any) => {
        console.log(`✅ Account created: ${account.providerId} for user ${account.userId}`)
        
        // Log account linking for security monitoring
        if (account.providerId !== 'credential') {
          console.log(`🔗 OAuth account linked: ${account.providerId} for user ${account.userId}`)
        }
      },
    },
  },
}
