// hooks/use-auth.ts
"use client"

import { useState, useEffect } from "react"
import type { Session, User } from "../lib/auth"

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // This would fetch the current session from the API
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const sessionData = await response.json()
          setAuthState({
            user: sessionData.user,
            session: sessionData.session,
            isLoading: false,
            isAuthenticated: !!sessionData.user,
          })
        } else {
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error("Failed to fetch session:", error)
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    fetchSession()
  }, [])

  return authState
}

// Auth actions
export const authActions = {
  signIn: async (email: string, password: string) => {
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
    return response
  },

  signUp: async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        email, 
        password, 
        name: `${firstName} ${lastName}`,
        firstName,
        lastName 
      }),
    })
    return response
  },

  signOut: async () => {
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
    })
    return response
  },
}
