"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { signIn, getErrorMessage } from "@/lib/auth-client"
import { toast } from "sonner"

interface GitHubOAuthButtonProps {
  mode?: 'signin' | 'signup'
  disabled?: boolean
  className?: string
}

export default function GitHubOAuthButton({ 
  mode = 'signin', 
  disabled = false, 
  className = "" 
}: GitHubOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGitHubAuth = async () => {
    setIsLoading(true)
    
    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      }, {
        onRequest: () => {
          console.log('GitHub OAuth request started');
        },
        onSuccess: () => {
          console.log('GitHub OAuth successful, redirecting to dashboard');
          toast.success(mode === 'signin' ? 'Signed in successfully!' : 'Account created successfully!');
          router.push("/dashboard");
        },
        onError: (ctx) => {
          console.error('GitHub OAuth error context:', ctx);
          const errorMessage = getErrorMessage(ctx.error);
          toast.error(errorMessage);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={`w-full bg-gray-900 hover:bg-gray-800 text-white border-gray-700 ${className}`}
      disabled={disabled || isLoading}
      onClick={handleGitHubAuth}
    >
      <div className="flex items-center justify-center space-x-3">
        {/* GitHub Logo SVG */}
        <svg 
          className="w-5 h-5 fill-current" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <span className="font-medium text-sm">
          {isLoading 
            ? (mode === 'signin' ? "Signing in with GitHub..." : "Signing up with GitHub...")
            : (mode === 'signin' ? "Sign in with GitHub" : "Sign up with GitHub")
          }
        </span>
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
      </div>
    </Button>
  )
}
