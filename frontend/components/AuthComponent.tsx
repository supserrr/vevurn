"use client"

import { useSession, signOut } from "../lib/auth-client"
import { useRouter } from "next/navigation"

export default function AuthComponent() {
  const {
    data: session,
    isPending, // loading state
    error,     // error object
    refetch    // refetch the session
  } = useSession()
  
  const router = useRouter()

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error: {error.message}
        <button 
          onClick={() => refetch()}
          className="ml-2 text-sm underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (session) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-green-800">
              Welcome, {session.user.name || session.user.email}!
            </h3>
            <p className="text-sm text-green-600">
              Role: {(session.user as any).role || 'User'}
            </p>
            <p className="text-xs text-green-500">
              Email: {session.user.email}
            </p>
          </div>
          <button 
            onClick={() => signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/auth/signin") // redirect to login page
                },
              },
            })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Access Required</h2>
      <p className="text-gray-600">Please sign in to access the POS system</p>
      <div className="space-x-4">
        <button 
          onClick={() => router.push("/auth/signin")}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
        <button 
          onClick={() => router.push("/auth/signup")}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Create Account
        </button>
      </div>
    </div>
  )
}
