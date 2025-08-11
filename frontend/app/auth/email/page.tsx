'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, 
  Shield, 
  Key, 
  Clock, 
  CheckCircle, 
  Eye, 
  Lock, 
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react'
import { EmailPasswordAuth } from '@/components/auth/email-password-auth'

export default function EmailAuthPage() {
  const features = [
    {
      icon: Mail,
      title: 'Email Verification',
      description: 'Secure email verification with customizable templates',
      status: 'enabled',
      details: [
        'Automatic verification emails',
        'Custom email templates',
        'Resend verification option',
        'Email change verification'
      ]
    },
    {
      icon: Lock,
      title: 'Password Security',
      description: 'Strong password policies and secure storage',
      status: 'enabled',
      details: [
        'Minimum 8 characters',
        'Maximum 128 characters',
        'Mixed case requirements',
        'Number requirements'
      ]
    },
    {
      icon: Key,
      title: 'Password Reset',
      description: 'Secure password reset with time-limited tokens',
      status: 'enabled',
      details: [
        '1-hour reset tokens',
        'Email-based reset flow',
        'Secure token generation',
        'One-time use tokens'
      ]
    },
    {
      icon: Shield,
      title: 'Session Security',
      description: 'Advanced session management and security',
      status: 'enabled',
      details: [
        'Secure cookie storage',
        'Session revocation',
        'Multi-device management',
        'Fresh session validation'
      ]
    }
  ]

  const passwordRequirements = [
    { text: 'At least 8 characters', icon: CheckCircle },
    { text: 'Maximum 128 characters', icon: CheckCircle },
    { text: 'One uppercase letter (A-Z)', icon: CheckCircle },
    { text: 'One lowercase letter (a-z)', icon: CheckCircle },
    { text: 'One number (0-9)', icon: CheckCircle }
  ]

  const securityFeatures = [
    {
      title: 'Rate Limiting',
      description: 'Protection against brute force attacks',
      icon: Shield,
      color: 'green'
    },
    {
      title: 'Session Management',
      description: 'Secure session handling with Redis',
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Fresh Sessions',
      description: '2-hour freshness for sensitive operations',
      icon: RefreshCw,
      color: 'purple'
    },
    {
      title: 'Account Linking',
      description: 'Link email accounts with OAuth providers',
      icon: Key,
      color: 'orange'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Mail className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">Email & Password Authentication</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive email and password authentication system with Better Auth, 
          featuring advanced security, email verification, and password management.
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="default">Better Auth v1.3+</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="outline">Production Ready</Badge>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <feature.icon className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <Badge 
                  variant="default" 
                  className="ml-auto text-xs bg-green-100 text-green-800"
                >
                  {feature.status}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Password Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Requirements
          </CardTitle>
          <CardDescription>
            Strong password policies ensure account security and prevent unauthorized access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {passwordRequirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <req.icon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">{req.text}</span>
              </div>
            ))}
          </div>
          
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Passwords are hashed using industry-standard algorithms 
              and stored securely. Reset tokens expire after 1 hour for maximum security.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Security Features
          </CardTitle>
          <CardDescription>
            Enterprise-grade security features protecting your authentication system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className={`p-2 rounded-lg bg-${feature.color}-100`}>
                  <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Verification Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification Flow
          </CardTitle>
          <CardDescription>
            Comprehensive email verification process ensuring account authenticity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold">Account Creation</h4>
                <p className="text-sm text-muted-foreground">
                  User creates account with email and secure password following our requirements
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold">Email Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Verification email sent with secure token and clear instructions
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold">Account Activated</h4>
                <p className="text-sm text-muted-foreground">
                  Account fully activated with access to all features and services
                </p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Email verification is required before accessing 
                protected features. Verification links are valid for 24 hours.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Main Authentication Component */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Try It Now</h2>
          <p className="text-muted-foreground">
            Experience the complete email and password authentication system
          </p>
        </div>
        
        <EmailPasswordAuth className="max-w-2xl mx-auto" />
      </div>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Implementation Details
          </CardTitle>
          <CardDescription>
            Technical implementation following Better Auth documentation patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Backend Configuration</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Email & Password plugin enabled
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Password security settings configured
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Reset token expiration (1 hour)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Custom password reset callbacks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Additional fields support (firstName, lastName)
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Frontend Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Type-safe authentication helpers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Comprehensive error handling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Real-time password validation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Professional UI components
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
              documentation patterns and security best practices for production deployment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
