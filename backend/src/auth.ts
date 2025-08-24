// backend/src/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./services/email.service";

const prisma = new PrismaClient();

export const auth = betterAuth({
  // Database configuration
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // App configuration
  appName: "Vevurn POS",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8000",
  
  // Security configuration
  secret: process.env.BETTER_AUTH_SECRET!,
  
  // User schema customization
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CASHIER",
        input: false, // Don't allow user to set role during signup
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      employeeId: {
        type: "string",
        required: false,
        input: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      department: {
        type: "string",
        required: false,
        input: false,
      },
      hireDate: {
        type: "date",
        required: false,
        input: false,
      },
      salary: {
        type: "number",
        required: false,
        input: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
    
    deleteUser: {
      enabled: true,
      
      async sendDeleteAccountVerification({ user, url, token }, request) {
        await sendEmail({
          to: user.email,
          subject: "Confirm Account Deletion - Vevurn POS",
          template: "account-deletion",
          data: {
            userName: user.name,
            deletionUrl: url,
            token,
          },
        });
      },

      async beforeDelete(user, request) {
        // Check if user has active sales or other dependencies
        const activeSales = await prisma.sale.count({
          where: {
            cashierId: user.id,
            status: "COMPLETED",
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        });

        if (activeSales > 0) {
          throw new Error("Cannot delete user with recent sales activity");
        }
      },

      async afterDelete(user, request) {
        console.log(`User deleted: ${user.email}`);
        // Clean up any related data
      },
    },

    changeEmail: {
      enabled: true,
      
      async sendChangeEmailVerification({ user, newEmail, url, token }, request) {
        await sendEmail({
          to: user.email, // Send to current email for security
          subject: "Confirm Email Change - Vevurn POS",
          template: "email-change",
          data: {
            userName: user.name,
            newEmail,
            confirmationUrl: url,
            token,
          },
        });
      },
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    
    // Password reset configuration
    async sendResetPassword({ user, url, token }, request) {
      await sendEmail({
        to: user.email,
        subject: "Reset Your Vevurn POS Password",
        template: "password-reset",
        data: {
          userName: user.name,
          resetUrl: url,
          token,
        },
      });
    },

    // Password reset callback
    async onPasswordReset({ user }, request) {
      console.log(`Password reset for user: ${user.email}`);
      // Log password reset event
      // You can add additional logic here like logging to audit trail
    },
  },

  // Email verification
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    
    async sendVerificationEmail({ user, url, token }, request) {
      await sendEmail({
        to: user.email,
        subject: "Verify Your Vevurn POS Account",
        template: "email-verification",
        data: {
          userName: user.name,
          verificationUrl: url,
          token,
        },
      });
    },

    async afterEmailVerification(user, request) {
      console.log(`Email verified for user: ${user.email}`);
      // Additional logic after email verification
    },
  },

  // Social authentication providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Advanced security configuration
  advanced: {
    crossSubDomainCookies: {
      enabled: false, // Enable if you have multiple subdomains
    },
    cookiePrefix: "vevurn_pos",
    useSecureCookies: process.env.NODE_ENV === "production",
    
    // IP address configuration for rate limiting
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60, // 1 minute
    max: 10, // 10 requests per minute
    
    customRules: {
      "/sign-in/email": {
        window: 60 * 5, // 5 minutes
        max: 5, // 5 attempts per 5 minutes
      },
      "/reset-password": {
        window: 60 * 15, // 15 minutes
        max: 3, // 3 attempts per 15 minutes
      },
    },
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:3000"],
    credentials: true,
  },

  // Trusted origins
  trustedOrigins: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:3000"],

  // Plugins
  plugins: [
    admin({
      adminRoles: ["ADMIN"],
      defaultRole: "CASHIER",
      
      // Admin users by ID (for initial setup)
      adminUserIds: process.env.ADMIN_USER_IDS?.split(',') || [],
      
      impersonationSessionDuration: 60 * 60, // 1 hour
      defaultBanReason: "Violated terms of service",
      defaultBanExpiresIn: 60 * 60 * 24 * 7, // 7 days
      bannedUserMessage: "Your account has been suspended. Please contact your administrator.",
    }),
  ],

  // Database hooks for audit logging
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          // Generate employee ID
          const count = await prisma.user.count();
          const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
          
          return {
            data: {
              ...user,
              employeeId,
              hireDate: new Date(),
            },
          };
        },
        
        after: async (user, ctx) => {
          // Log user creation
          try {
            await prisma.auditLog.create({
              data: {
                userId: ctx?.context?.session?.user?.id || null,
                action: "USER_CREATED",
                resourceType: "USER",
                resourceId: user.id,
                newValues: {
                  email: user.email,
                  name: user.name,
                  role: (user as any).role || "CASHIER",
                },
                ipAddress: (ctx?.context?.request?.headers?.["x-forwarded-for"] as string) || null,
                userAgent: (ctx?.context?.request?.headers?.["user-agent"] as string) || null,
              },
            });
          } catch (error) {
            console.error('Failed to log user creation:', error);
          }
        },
      },
      
      update: {
        before: async (data, ctx) => {
          // Update lastLoginAt on login
          if (ctx?.context?.session) {
            return {
              data: {
                ...data,
                lastLoginAt: new Date(),
              },
            };
          }
          return { data };
        },
        
        after: async (user, ctx) => {
          // Log user updates
          try {
            await prisma.auditLog.create({
              data: {
                userId: ctx?.context?.session?.user?.id || null,
                action: "USER_UPDATED",
                resourceType: "USER", 
                resourceId: user.id,
                newValues: {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                },
                ipAddress: (ctx?.context?.request?.headers?.["x-forwarded-for"] as string) || null,
                userAgent: (ctx?.context?.request?.headers?.["user-agent"] as string) || null,
              },
            });
          } catch (error) {
            console.error('Failed to log user update:', error);
          }
        },
      },
    },
    
    session: {
      create: {
        after: async (session, ctx) => {
          // Log login
          try {
            await prisma.auditLog.create({
              data: {
                userId: session.userId,
                action: "USER_LOGIN",
                resourceType: "SESSION",
                resourceId: session.id,
                ipAddress: (ctx?.context?.request?.headers?.["x-forwarded-for"] as string) || null,
                userAgent: (ctx?.context?.request?.headers?.["user-agent"] as string) || null,
              },
            });
          } catch (error) {
            console.error('Failed to log user login:', error);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
