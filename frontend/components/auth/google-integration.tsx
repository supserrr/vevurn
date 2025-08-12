'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Mail, 
  HardDrive, 
  Shield, 
  Plus,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { signIn, useSession, listAccounts } from '@/lib/auth-client'
import { toast } from '@/hooks/use-toast'

interface GoogleAccount {
  id: string
  provider: string
  scopes: string[]
  createdAt: Date
  accessToken?: string
  refreshToken?: string
}

interface GoogleIntegrationProps {
  className?: string
}

const GOOGLE_SCOPES = {
  'https://www.googleapis.com/auth/drive.file': {
    name: 'Google Drive',
    description: 'Access and manage your Google Drive files',
    icon: HardDrive,
    category: 'Storage'
  },
  'https://www.googleapis.com/auth/gmail.readonly': {
    name: 'Gmail',
    description: 'Read your Gmail messages',
    icon: Mail,
    category: 'Communication'
  },
  'https://www.googleapis.com/auth/calendar.readonly': {
    name: 'Google Calendar',
    description: 'View your Google Calendar events',
    icon: Calendar,
    category: 'Productivity'
  }
} as const

export function GoogleIntegration({ className }: GoogleIntegrationProps) {
  const { data: session } = useSession()
  const [googleAccount, setGoogleAccount] = useState<GoogleAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingScope, setLoadingScope] = useState<string | null>(null)

  // Load Google account information
  React.useEffect(() => {
    if (session) {
      loadGoogleAccount()
    }
  }, [session])

  const loadGoogleAccount = async () => {
    try {
      const accounts = await listAccounts()
      const google = accounts.data?.find(acc => acc.provider === 'google')
      if (google) {
        setGoogleAccount(google as GoogleAccount)
      }
    } catch (error) {
      console.error('Failed to load Google account:', error)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard?google-connected=true"
      })
    } catch (error) {
      console.error('Google sign-in failed:', error)
      toast({
        title: "Error",
        description: "Failed to connect Google account",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestScope = async (scopeUrl: string, scopeName: string) => {
    try {
      setLoadingScope(scopeUrl)
      // Note: Additional scopes would need to be handled through Better Auth configuration
      toast({
        title: "Scope Request",
        description: "Additional scopes need to be configured in Better Auth settings",
        variant: "destructive"
      })
      return
      
      // Reload account info to show new scopes
      await loadGoogleAccount()
      
      toast({
        title: "Success",
        description: `${scopeName} access granted successfully`
      })
    } catch (error) {
      console.error(`Failed to request ${scopeName} access:`, error)
      toast({
        title: "Error",
        description: `Failed to grant ${scopeName} access`,
        variant: "destructive"
      })
    } finally {
      setLoadingScope(null)
    }
  }

  const hasScope = (scopeUrl: string) => {
    return googleAccount?.scopes?.includes(scopeUrl) || false
  }

  const getScopesByCategory = () => {
    const categories: Record<string, Array<{ url: string; config: typeof GOOGLE_SCOPES[keyof typeof GOOGLE_SCOPES] }>> = {}
    
    Object.entries(GOOGLE_SCOPES).forEach(([url, config]) => {
      if (!categories[config.category]) {
        categories[config.category] = []
      }
      categories[config.category].push({ url, config })
    })
    
    return categories
  }

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to manage Google integration</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Google Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-red-500 rounded"></div>
            Google Integration
          </CardTitle>
          <CardDescription>
            Connect your Google account to access additional services and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!googleAccount ? (
            <div className="text-center space-y-4">
              <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Google Account Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your Google account to access Drive, Gmail, Calendar and other Google services
                </p>
                <Button onClick={handleGoogleSignIn} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-red-500 rounded mr-2"></div>
                      Connect Google Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Google Account Connected</p>
                  <p className="text-sm text-green-700">
                    Connected {new Date(googleAccount.createdAt).toLocaleDateString()} • 
                    {googleAccount.scopes?.length || 0} permissions granted
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              </div>

              {/* Current Permissions */}
              <div className="space-y-3">
                <h4 className="font-medium">Current Permissions</h4>
                {googleAccount.scopes && googleAccount.scopes.length > 0 ? (
                  <div className="grid gap-2">
                    {googleAccount.scopes.map((scope) => {
                      const scopeConfig = GOOGLE_SCOPES[scope as keyof typeof GOOGLE_SCOPES]
                      if (!scopeConfig) return null
                      
                      const IconComponent = scopeConfig.icon
                      return (
                        <div key={scope} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium">{scopeConfig.name}</p>
                            <p className="text-sm text-muted-foreground">{scopeConfig.description}</p>
                          </div>
                          <Badge variant="outline">
                            {scopeConfig.category}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No additional permissions granted yet</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Google Services */}
      {googleAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Available Google Services</CardTitle>
            <CardDescription>
              Grant additional permissions to access more Google services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(getScopesByCategory()).map(([category, scopes]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                  {category}
                </h4>
                <div className="grid gap-3">
                  {scopes.map(({ url, config }) => {
                    const IconComponent = config.icon
                    const isGranted = hasScope(url)
                    const isLoading = loadingScope === url
                    
                    return (
                      <div key={url} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <IconComponent className={`h-6 w-6 ${isGranted ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">{config.name}</p>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                          </div>
                        </div>
                        
                        {isGranted ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <Badge variant="secondary">Connected</Badge>
                          </div>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Connect
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Connect {config.name}</DialogTitle>
                                <DialogDescription>
                                  This will redirect you to Google to grant permission for {config.name} access.
                                  You'll be redirected back to your dashboard once complete.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button 
                                  onClick={() => handleRequestScope(url, config.name)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Grant Permission
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy & Security:</strong> We only request the minimum permissions needed for each feature. 
                You can revoke these permissions at any time through your Google account settings.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {googleAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Commonly requested Google service integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant={hasScope('https://www.googleapis.com/auth/drive.file') ? "secondary" : "outline"} 
                onClick={() => !hasScope('https://www.googleapis.com/auth/drive.file') && 
                  handleRequestScope('https://www.googleapis.com/auth/drive.file', 'Google Drive')}
                disabled={hasScope('https://www.googleapis.com/auth/drive.file') || loadingScope === 'https://www.googleapis.com/auth/drive.file'}
                className="h-auto p-4 flex-col gap-2"
              >
                <HardDrive className="h-6 w-6" />
                <span>Drive Access</span>
                {hasScope('https://www.googleapis.com/auth/drive.file') && (
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                )}
              </Button>

              <Button 
                variant={hasScope('https://www.googleapis.com/auth/gmail.readonly') ? "secondary" : "outline"}
                onClick={() => !hasScope('https://www.googleapis.com/auth/gmail.readonly') && 
                  handleRequestScope('https://www.googleapis.com/auth/gmail.readonly', 'Gmail')}
                disabled={hasScope('https://www.googleapis.com/auth/gmail.readonly') || loadingScope === 'https://www.googleapis.com/auth/gmail.readonly'}
                className="h-auto p-4 flex-col gap-2"
              >
                <Mail className="h-6 w-6" />
                <span>Gmail Access</span>
                {hasScope('https://www.googleapis.com/auth/gmail.readonly') && (
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                )}
              </Button>

              <Button 
                variant={hasScope('https://www.googleapis.com/auth/calendar.readonly') ? "secondary" : "outline"}
                onClick={() => !hasScope('https://www.googleapis.com/auth/calendar.readonly') && 
                  handleRequestScope('https://www.googleapis.com/auth/calendar.readonly', 'Calendar')}
                disabled={hasScope('https://www.googleapis.com/auth/calendar.readonly') || loadingScope === 'https://www.googleapis.com/auth/calendar.readonly'}
                className="h-auto p-4 flex-col gap-2"
              >
                <Calendar className="h-6 w-6" />
                <span>Calendar Access</span>
                {hasScope('https://www.googleapis.com/auth/calendar.readonly') && (
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
