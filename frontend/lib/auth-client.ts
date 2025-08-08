import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:8000",
  basePath: "/api/better-auth"
})

// Export specific methods for convenience
export const { signIn, signUp, signOut, useSession, getSession } = authClient
