"use client"

import { useState } from "react"
import { signUp } from "../lib/auth-client"
import { useRouter } from "next/navigation"
import SocialAuthButtons from "./SocialAuthButtons"

export default function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const validateForm = () => {
    if (!firstName.trim()) {
      setError("First name is required")
      return false
    }
    if (!lastName.trim()) {
      setError("Last name is required")
      return false
    }
    if (!email.trim()) {
      setError("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format")
      return false
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    // Log the exact request payload for debugging
    const requestData = {
      email: email.trim(),
      password,
      name: `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      callbackURL: "/dashboard",
      // Additional Better Auth fields
      role: "cashier", // Default role for new users
      employeeId: "", // Will be set by admin later (empty string instead of null)
      isActive: true,
      maxDiscountAllowed: 0,
      canSellBelowMin: false
    }

    console.log('Registration payload:', requestData)

    try {
      const { data, error: signUpError } = await signUp.email(requestData, {
        onRequest: () => {
          console.log('Registration request started')
        },
        onSuccess: () => {
          console.log('Registration successful, redirecting to dashboard')
          router.push("/dashboard")
        },
        onError: (ctx: any) => {
          console.error('Registration error context:', ctx)
          setError(ctx.error?.message || "Registration failed")
          setIsLoading(false)
        },
      })

      if (signUpError) {
        console.error('Sign up error:', signUpError)
        setError(signUpError.message || "An error occurred during sign up")
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Unexpected registration error:', error)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Password must be at least 8 characters long
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <SocialAuthButtons 
          mode="signup" 
          disabled={isLoading}
          showDivider={false}
          providers={['google', 'microsoft']}
        />
      </form>

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/auth/signin" className="text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        </span>
      </div>
    </div>
  )
}
