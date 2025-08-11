"use client"

import GoogleOAuthButton from "./GoogleOAuthButton"
import MicrosoftOAuthButton from "./MicrosoftOAuthButton"
import GitHubOAuthButton from "./GitHubOAuthButton"

interface SocialAuthButtonsProps {
  mode?: 'signin' | 'signup'
  disabled?: boolean
  className?: string
  providers?: ('google' | 'microsoft' | 'github')[]
  showDivider?: boolean
}

export default function SocialAuthButtons({ 
  mode = 'signin',
  disabled = false,
  className = "",
  providers = ['google', 'microsoft', 'github'],
  showDivider = true
}: SocialAuthButtonsProps) {
  
  // Check if we have any providers to show
  const hasProviders = providers.length > 0

  if (!hasProviders) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500 font-medium">
              Or continue with
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {providers.includes('google') && (
          <GoogleOAuthButton 
            mode={mode} 
            disabled={disabled}
          />
        )}
        
        {providers.includes('microsoft') && (
          <MicrosoftOAuthButton 
            mode={mode} 
            disabled={disabled}
          />
        )}
        
        {providers.includes('github') && (
          <GitHubOAuthButton 
            mode={mode} 
            disabled={disabled}
          />
        )}
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        By signing {mode === 'signin' ? 'in' : 'up'} with social providers, you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
