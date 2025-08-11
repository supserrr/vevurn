'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Shield, 
  Key, 
  Mail, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Clock,
  Database,
  Server
} from 'lucide-react'
import { AccountManagement } from '@/components/auth/account-management'
import { GoogleIntegration } from '@/components/auth/google-integration'
import { EmailPasswordAuth } from '@/components/auth/email-password-auth'
import { useSession } from '@/lib/auth-client'

interface AuthDemoProps {
  className?: string
}

export function AuthDemo({ className }: AuthDemoProps) {
  const { data: session, isPending, error } = useSession()
  const [activeTab, setActiveTab] = useState('overview')

  const features = [
    {
      icon: Shield,
      title: 'Enhanced Security',
      description: 'Multi-factor authentication, session management, and rate limiting',
      status: 'active',
      color: 'green'
    },
    {
      icon: Key,
      title: 'OAuth Integration',
      description: 'Google, Microsoft, GitHub with refresh token support',
      status: 'active',
      color: 'blue'
    },
    {
      icon: User,
      title: 'User Management',
      description: 'Profile updates, email changes, account deletion',
      status: 'active',
      color: 'purple'
    },
    {
      icon: Database,
      title: 'TypeScript Integration',
      description: 'Full type safety with Better Auth patterns',
      status: 'active',
      color: 'indigo'
    },
    {
      icon: Zap,
      title: 'Rate Limiting',
      description: 'Intelligent Redis-backed rate limiting',
      status: 'active',
      color: 'yellow'
    },
    {
      icon: Server,
      title: 'Production Ready',
      description: 'Scalable architecture with monitoring',
      status: 'active',
      color: 'green'
    }
  ]

  const sessionInfo = [
    {
      label: 'Session ID',
      value: session?.session?.id || 'Not available',
      icon: Key
    },
    {
      label: 'Session Expires',
      value: session?.session?.expiresAt 
        ? new Date(session.session.expiresAt).toLocaleString()
        : 'Not available',
      icon: Clock
    },
    {
      label: 'User ID', 
      value: session?.user?.id || 'Not available',
      icon: User
    },
    {
      label: 'Email Verified',
      value: session?.user?.emailVerified ? 'Yes' : 'No',
      icon: Mail
    }
  ]

  if (isPending) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Authentication Error: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Better Auth Integration Demo
          </CardTitle>
          <CardDescription>
            Complete authentication system with TypeScript, OAuth, user management, and advanced security features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature) => {
              const IconComponent = feature.icon
              return (
                <div key={feature.title} className="text-center space-y-2">
                  <div className={`w-12 h-12 mx-auto rounded-full bg-${feature.color}-100 flex items-center justify-center`}>
                    <IconComponent className={`h-6 w-6 text-${feature.color}-600`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {feature.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {session ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Authentication Active
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Not Authenticated
              </>
            )}
          </CardTitle>
          <CardDescription>
            Current authentication status and session information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionInfo.map((info) => {
                  const IconComponent = info.icon
                  return (
                    <div key={info.label} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{info.label}</p>
                        <p className="text-sm text-muted-foreground">{info.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Session Management:</strong> Your session is automatically managed with secure cookies, 
                  rate limiting, and refresh tokens for optimal security and user experience.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to access the authentication features and user management tools.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Features Tabs */}
      {session ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="email">Email & Password</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Implementation Overview</CardTitle>
                <CardDescription>
                  Complete Better Auth integration with advanced features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Backend Features</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        TypeScript strict mode compilation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Enhanced user management (create, update, delete)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Email change with verification
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Account linking/unlinking
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        GDPR-compliant account deletion
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Redis-backed rate limiting
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Frontend Features</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Type-safe authentication client
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Comprehensive account management UI
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Google OAuth with additional scopes
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Professional UI components
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Error handling and loading states
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Responsive design
                      </li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Production Ready:</strong> This implementation follows all Better Auth 
                    documentation patterns and best practices for production deployment.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <AccountManagement />
          </TabsContent>

          <TabsContent value="google" className="mt-6">
            <GoogleIntegration />
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <EmailPasswordAuth />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Features
                </CardTitle>
                <CardDescription>
                  Advanced security features and configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Session Security</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-900">Secure Cookies</p>
                        <p className="text-sm text-green-700">HttpOnly, SameSite, Secure cookies</p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-900">Session Refresh</p>
                        <p className="text-sm text-blue-700">Automatic token refresh with Redis</p>
                      </div>
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="font-medium text-purple-900">Fresh Sessions</p>
                        <p className="text-sm text-purple-700">2-hour freshness for sensitive operations</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Rate Limiting</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="font-medium text-yellow-900">Intelligent Storage</p>
                        <p className="text-sm text-yellow-700">Redis → Database → Memory fallback</p>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-900">Protection</p>
                        <p className="text-sm text-red-700">Brute force and spam prevention</p>
                      </div>
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="font-medium text-indigo-900">Configurable</p>
                        <p className="text-sm text-indigo-700">Per-endpoint rate limits</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security First:</strong> All security features follow industry best practices 
                    with proper encryption, secure storage, and audit trails.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <EmailPasswordAuth />
      )}
    </div>
  )
}
