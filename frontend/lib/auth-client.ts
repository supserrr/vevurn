"use client";

import { createAuthClient } from "better-auth/react";

// Environment configuration
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin.includes("localhost") 
      ? "http://localhost:8001" 
      : "https://vevurn.onrender.com";
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
};

// Better Auth client configuration with enhanced error handling
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    onError: (ctx) => {
      console.error('🚨 Auth error:', {
        error: ctx.error,
        url: ctx.request.url,
        method: ctx.request.method,
        status: ctx.response?.status,
        timestamp: new Date().toISOString()
      });
      
      // Enhanced error logging for OAuth issues
      if (ctx.request.url.includes('/social/') || ctx.request.url.includes('/callback/')) {
        console.error('🔍 OAuth Error Details:', {
          provider: ctx.request.url.includes('google') ? 'google' : 'unknown',
          errorType: ctx.error?.message || 'Unknown OAuth error',
          requestUrl: ctx.request.url
        });
      }
    },
    onRequest: (ctx) => {
      console.log('🌐 Auth request:', ctx.request.method, ctx.request.url);
    },
    onSuccess: (ctx) => {
      console.log('✅ Auth request successful:', ctx.request.url);
    }
  }
});

// Enhanced Google OAuth helper with error handling
export const handleGoogleSignIn = async (redirectTo = '/dashboard') => {
  try {
    console.log('🔍 Starting Google OAuth sign-in...');
    
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: redirectTo
    });
    
    console.log('✅ Google OAuth successful:', result);
    return result;
    
  } catch (error: any) {
    console.error('❌ Google OAuth failed:', error);
    
    // Enhanced error handling for common OAuth issues
    if (error.message?.includes('access_denied')) {
      const userMessage = 'OAuth permission was denied. Please try again and allow access to your Google account.';
      console.error('🚫 Access denied:', userMessage);
      throw new Error(userMessage);
    }
    
    if (error.message?.includes('unable_to_create_user')) {
      const userMessage = 'Unable to create your account. Please try again in a few minutes.';
      console.error('👤 User creation failed:', userMessage);
      throw new Error(userMessage);
    }
    
    if (error.message?.includes('rate_limit') || error.message?.includes('too_many_requests')) {
      const userMessage = 'Too many sign-in attempts. Please wait 5 minutes and try again.';
      console.error('⏰ Rate limited:', userMessage);
      throw new Error(userMessage);
    }
    
    // Generic error fallback
    const userMessage = 'Sign-in failed. Please try again or contact support if the issue persists.';
    console.error('🔧 Generic OAuth error:', userMessage);
    throw new Error(userMessage);
  }
};

// Export Better Auth methods directly
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
} = authClient;

// Better Auth TypeScript Integration
export type Session = typeof authClient.$Infer.Session;
export type User = Session['user'];

// Simple error message helper
export const getErrorMessage = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return "An error occurred";
};

// Export auth client as default
export default authClient;
