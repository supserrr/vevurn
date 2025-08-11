'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Mail, Shield, Link as LinkIcon, Unlink, Eye, EyeOff, UserX } from 'lucide-react'
import { 
  updateUser, 
  changeEmail, 
  linkSocial, 
  unlinkAccount, 
  listAccounts,
  deleteUser,
  useSession 
} from '@/lib/auth-client'
import { toast } from '@/hooks/use-toast'

interface Account {
  id: string
  provider: string
  accountId: string
  createdAt: Date
  updatedAt: Date
  scopes: string[]
}

interface AccountManagementProps {
  className?: string
}

export function AccountManagement({ className }: AccountManagementProps) {
  const { data: session, isPending } = useSession()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Load user accounts
  React.useEffect(() => {
    if (session) {
      loadAccounts()
    }
  }, [session])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const userAccounts = await listAccounts()
      setAccounts(userAccounts.data || [])
    } catch (error) {
      console.error('Failed to load accounts:', error)
      toast({
        title: "Error",
        description: "Failed to load linked accounts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      await updateUser({
        name: formData.name,
        image: session?.user?.image
      })
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
    } catch (error) {
      console.error('Profile update failed:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!formData.newEmail.trim()) {
      toast({
        title: "Error",
        description: "New email is required",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      await changeEmail({
        newEmail: formData.newEmail,
        callbackURL: '/dashboard?email-changed=true'
      })
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your current email for verification instructions"
      })
      setFormData(prev => ({ ...prev, newEmail: '' }))
    } catch (error) {
      console.error('Email change failed:', error)
      toast({
        title: "Error",
        description: "Failed to change email",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLinkSocial = async (provider: string) => {
    try {
      setLoading(true)
      await linkSocial({
        provider,
        callbackURL: '/dashboard?account-linked=true'
      })
    } catch (error) {
      console.error('Account linking failed:', error)
      toast({
        title: "Error",
        description: `Failed to link ${provider} account`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkAccount = async (providerId: string, accountId: string) => {
    try {
      setLoading(true)
      await unlinkAccount({
        providerId: providerId,
        accountId
      })
      
      await loadAccounts() // Refresh accounts list
      toast({
        title: "Success",
        description: `${providerId} account unlinked successfully`
      })
    } catch (error) {
      console.error('Account unlinking failed:', error)
      toast({
        title: "Error", 
        description: "Failed to unlink account",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setLoading(true)
      await deleteUser({
        callbackURL: '/goodbye'
      })
      
      toast({
        title: "Account Deletion Initiated",
        description: "Please check your email for confirmation instructions"
      })
    } catch (error) {
      console.error('Account deletion failed:', error)
      toast({
        title: "Error",
        description: "Failed to initiate account deletion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (isPending || !session) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={session.user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              To change your email, use the email change section below
            </p>
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Change Email
          </CardTitle>
          <CardDescription>
            Change your email address. A verification email will be sent to your current email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEmail">New Email Address</Label>
            <Input
              id="newEmail"
              type="email"
              value={formData.newEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, newEmail: e.target.value }))}
              placeholder="Enter new email address"
            />
          </div>
          
          <Button onClick={handleChangeEmail} disabled={loading || !formData.newEmail}>
            {loading ? 'Sending...' : 'Send Verification Email'}
          </Button>
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Manage your connected social accounts for easy sign-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && accounts.length === 0 ? (
            <div className="animate-pulse space-y-2">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          ) : (
            <>
              {accounts.length > 0 && (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{account.provider}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Connected {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Unlink className="h-4 w-4 mr-2" />
                            Unlink
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Unlink Account</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to unlink your {account.provider} account? 
                              You won't be able to sign in using this method anymore.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleUnlinkAccount(account.provider, account.accountId)}
                              disabled={loading}
                            >
                              {loading ? 'Unlinking...' : 'Unlink Account'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Link Additional Accounts</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => handleLinkSocial('google')}
                    disabled={loading || accounts.some(a => a.provider === 'google')}
                  >
                    Link Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleLinkSocial('microsoft')}
                    disabled={loading || accounts.some(a => a.provider === 'microsoft')}
                  >
                    Link Microsoft
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleLinkSocial('github')}
                    disabled={loading || accounts.some(a => a.provider === 'github')}
                  >
                    Link GitHub
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <UserX className="h-4 w-4" />
            <AlertDescription>
              Account deletion is permanent and cannot be undone. All your data will be permanently removed.
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers. You will receive a verification
                  email before the deletion is processed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Send Deletion Email'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
