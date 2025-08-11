'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Key,
  Send
} from 'lucide-react'
import { emailAuth, useSession } from '@/lib/auth-client'
import { toast } from '@/hooks/use-toast'

interface EmailPasswordAuthProps {
  className?: string
}

export function EmailPasswordAuth({ className }: EmailPasswordAuthProps) {
  const { data: session, isPending } = useSession()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    // Sign In
    signInEmail: '',
    signInPassword: '',
    rememberMe: true,
    
    // Sign Up
    signUpName: '',
    signUpEmail: '',
    signUpPassword: '',
    signUpConfirmPassword: '',
    
    // Reset Password
    resetEmail: '',
    
    // Change Password
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    revokeOtherSessions: true
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (password.length > 128) errors.push('Maximum 128 characters')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/\d/.test(password)) errors.push('One number')
    return errors
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSignIn = async () => {
    setValidationErrors({})
    
    if (!validateEmail(formData.signInEmail)) {
      setValidationErrors({ signInEmail: 'Please enter a valid email address' })
      return
    }
    
    if (!formData.signInPassword) {
      setValidationErrors({ signInPassword: 'Password is required' })
      return
    }

    try {
      setLoading(true)
      
      await emailAuth.signInWithEmailAndHandleErrors({
        email: formData.signInEmail,
        password: formData.signInPassword,
        rememberMe: formData.rememberMe,
        onEmailNotVerified: () => {
          toast({
            title: "Email Verification Required",
            description: "Please check your email and click the verification link before signing in.",
            variant: "destructive"
          })
        },
        onInvalidCredentials: () => {
          toast({
            title: "Invalid Credentials",
            description: "The email or password you entered is incorrect.",
            variant: "destructive"
          })
        },
        onGenericError: (error) => {
          toast({
            title: "Sign In Failed",
            description: error,
            variant: "destructive"
          })
        }
      })

      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in."
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setValidationErrors({})
    const errors: Record<string, string> = {}

    // Validation
    if (!formData.signUpName.trim()) {
      errors.signUpName = 'Name is required'
    }

    if (!validateEmail(formData.signUpEmail)) {
      errors.signUpEmail = 'Please enter a valid email address'
    }

    const passwordErrors = validatePassword(formData.signUpPassword)
    if (passwordErrors.length > 0) {
      errors.signUpPassword = `Password must have: ${passwordErrors.join(', ')}`
    }

    if (formData.signUpPassword !== formData.signUpConfirmPassword) {
      errors.signUpConfirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      setLoading(true)
      
      await emailAuth.signUpWithEmail({
        name: formData.signUpName,
        email: formData.signUpEmail,
        password: formData.signUpPassword
      })

      toast({
        title: "Account Created!",
        description: "Welcome to Vevurn POS! Please check your email for verification instructions."
      })

      // Switch to sign in tab
      setActiveTab('signin')
      setFormData(prev => ({
        ...prev,
        signInEmail: formData.signUpEmail,
        signUpName: '',
        signUpEmail: '',
        signUpPassword: '',
        signUpConfirmPassword: ''
      }))
    } catch (error) {
      console.error('Sign up error:', error)
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : 'Please try again',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setValidationErrors({})
    
    if (!validateEmail(formData.resetEmail)) {
      setValidationErrors({ resetEmail: 'Please enter a valid email address' })
      return
    }

    try {
      setLoading(true)
      
      await emailAuth.requestPasswordReset({
        email: formData.resetEmail
      })

      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions."
      })

      setFormData(prev => ({ ...prev, resetEmail: '' }))
    } catch (error) {
      console.error('Password reset error:', error)
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : 'Please try again',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setValidationErrors({})
    const errors: Record<string, string> = {}

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required'
    }

    const passwordErrors = validatePassword(formData.newPassword)
    if (passwordErrors.length > 0) {
      errors.newPassword = `Password must have: ${passwordErrors.join(', ')}`
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      setLoading(true)
      
      await emailAuth.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        revokeOtherSessions: formData.revokeOtherSessions
      })

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated."
      })

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }))
    } catch (error) {
      console.error('Change password error:', error)
      toast({
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : 'Please try again',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      await emailAuth.sendEmailVerification({
        email: session.user.email
      })
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for verification instructions."
      })
    } catch (error) {
      console.error('Resend verification error:', error)
      toast({
        title: "Failed to Send",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (session) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* User Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Status
            </CardTitle>
            <CardDescription>
              Current authentication status and account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Signed In</p>
                <p className="text-sm text-green-700">{session.user?.email}</p>
              </div>
              <Badge variant={session.user?.emailVerified ? "default" : "secondary"} className="ml-auto">
                {session.user?.emailVerified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>

            {!session.user?.emailVerified && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your email address is not verified. Please check your email or{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal"
                    onClick={handleResendVerification}
                    disabled={loading}
                  >
                    resend verification email
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password for enhanced security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className={validationErrors.currentPassword ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {validationErrors.currentPassword && (
                <p className="text-sm text-red-500">{validationErrors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className={validationErrors.newPassword ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {validationErrors.newPassword && (
                <p className="text-sm text-red-500">{validationErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmNewPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                className={validationErrors.confirmNewPassword ? "border-red-500" : ""}
              />
              {validationErrors.confirmNewPassword && (
                <p className="text-sm text-red-500">{validationErrors.confirmNewPassword}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="revokeOtherSessions"
                checked={formData.revokeOtherSessions}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, revokeOtherSessions: checked as boolean }))
                }
              />
              <Label htmlFor="revokeOtherSessions" className="text-sm">
                Sign out all other devices (recommended)
              </Label>
            </div>

            <Button onClick={handleChangePassword} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Email & Password Authentication
          </CardTitle>
          <CardDescription>
            Secure authentication with email verification and password management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="reset">Reset Password</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="signInEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signInEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.signInEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, signInEmail: e.target.value }))}
                    className={`pl-10 ${validationErrors.signInEmail ? "border-red-500" : ""}`}
                  />
                </div>
                {validationErrors.signInEmail && (
                  <p className="text-sm text-red-500">{validationErrors.signInEmail}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signInPassword">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signInPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.signInPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, signInPassword: e.target.value }))}
                    className={`pl-10 pr-10 ${validationErrors.signInPassword ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {validationErrors.signInPassword && (
                  <p className="text-sm text-red-500">{validationErrors.signInPassword}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                  }
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  Remember me
                </Label>
              </div>

              <Button onClick={handleSignIn} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="signUpName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.signUpName}
                    onChange={(e) => setFormData(prev => ({ ...prev, signUpName: e.target.value }))}
                    className={`pl-10 ${validationErrors.signUpName ? "border-red-500" : ""}`}
                  />
                </div>
                {validationErrors.signUpName && (
                  <p className="text-sm text-red-500">{validationErrors.signUpName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signUpEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.signUpEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, signUpEmail: e.target.value }))}
                    className={`pl-10 ${validationErrors.signUpEmail ? "border-red-500" : ""}`}
                  />
                </div>
                {validationErrors.signUpEmail && (
                  <p className="text-sm text-red-500">{validationErrors.signUpEmail}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signUpPassword">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    value={formData.signUpPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, signUpPassword: e.target.value }))}
                    className={`pl-10 pr-10 ${validationErrors.signUpPassword ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {validationErrors.signUpPassword && (
                  <p className="text-sm text-red-500">{validationErrors.signUpPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signUpConfirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpConfirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.signUpConfirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, signUpConfirmPassword: e.target.value }))}
                    className={`pl-10 pr-10 ${validationErrors.signUpConfirmPassword ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {validationErrors.signUpConfirmPassword && (
                  <p className="text-sm text-red-500">{validationErrors.signUpConfirmPassword}</p>
                )}
              </div>

              <Button onClick={handleSignUp} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </TabsContent>

            <TabsContent value="reset" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.resetEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, resetEmail: e.target.value }))}
                    className={`pl-10 ${validationErrors.resetEmail ? "border-red-500" : ""}`}
                  />
                </div>
                {validationErrors.resetEmail && (
                  <p className="text-sm text-red-500">{validationErrors.resetEmail}</p>
                )}
              </div>

              <Alert>
                <Send className="h-4 w-4" />
                <AlertDescription>
                  Enter your email address and we'll send you a link to reset your password.
                </AlertDescription>
              </Alert>

              <Button onClick={handlePasswordReset} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending Reset Email...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reset Email
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
