"use client";

import { createAuthClient } from "better-auth/react";

// Environment configuration
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin.includes("localhost") 
      ? "http://localhost:8000" 
      : "https://vevurn.onrender.com";
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
};

// Better Auth client configuration
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    onError: (ctx) => {
      console.error('Auth error:', ctx.error);
      // Handle global auth errors here if needed
    },
    onRequest: (ctx) => {
      console.log('Auth request started');
    },
    onSuccess: (ctx) => {
      console.log('Auth request successful');
    }
  }
});

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
