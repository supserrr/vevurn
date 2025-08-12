"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { signIn, getErrorMessage } from "@/lib/auth-client"
import { toast } from "sonner"

interface MicrosoftOAuthButtonProps {
  mode?: 'signin' | 'signup'
  disabled?: boolean
  className?: string
}

export default function MicrosoftOAuthButton({ 
  mode = 'signin', 
  disabled = false, 
  className = "" 
}: MicrosoftOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleMicrosoftAuth = async () => {
    setIsLoading(true)
    
    try {
      await signIn.social({
        provider: "microsoft",
        callbackURL: "/dashboard",
      }, {
        onRequest: () => {
          console.log('Microsoft OAuth request started');
        },
        onSuccess: () => {
          console.log('Microsoft OAuth successful, redirecting to dashboard');
          toast.success(mode === 'signin' ? 'Signed in successfully!' : 'Account created successfully!');
          router.push("/dashboard");
        },
        onError: (ctx) => {
          console.error('Microsoft OAuth error context:', ctx);
          const errorMessage = getErrorMessage(ctx.error);
          toast.error(errorMessage);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Microsoft OAuth error:', error);
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
      className={`w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300 ${className}`}
      disabled={disabled || isLoading}
      onClick={handleMicrosoftAuth}
    >
      <div className="flex items-center justify-center space-x-3">
        {/* Microsoft Logo SVG */}
        <svg 
          className="w-5 h-5" 
          viewBox="0 0 23 23" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
          <rect x="12" y="1" width="10" height="10" fill="#00a4ef"/>
          <rect x="1" y="12" width="10" height="10" fill="#ffb900"/>
          <rect x="12" y="12" width="10" height="10" fill="#7fba00"/>
        </svg>
        <span className="font-medium text-sm">
          {isLoading 
            ? (mode === 'signin' ? "Signing in with Microsoft..." : "Signing up with Microsoft...")
            : (mode === 'signin' ? "Sign in with Microsoft" : "Sign up with Microsoft")
          }
        </span>
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>
    </Button>
  )
}
