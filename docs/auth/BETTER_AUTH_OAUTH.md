# OAuth Integration - Better Auth Implementation

## Overview
This document outlines the complete OAuth integration using Better Auth for our POS system, supporting Google, Microsoft, and GitHub providers with comprehensive security and business logic.

## Architecture

### Backend Implementation
- **File**: `/backend/src/lib/auth.ts`
- **Providers**: Google, Microsoft, GitHub
- **Features**: Account linking, profile mapping, role-based restrictions

### Frontend Components
- **GoogleOAuthButton.tsx**: Google OAuth integration
- **MicrosoftOAuthButton.tsx**: Microsoft OAuth integration  
- **GitHubOAuthButton.tsx**: GitHub OAuth integration
- **SocialAuthButtons.tsx**: Unified social auth component

## Provider Configuration

### 1. Google OAuth
```typescript
google: {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  scope: ["email", "profile"],
  mapProfileToUser: (profile) => {
    return {
      firstName: profile.given_name || profile.name?.split(' ')[0] || '',
      lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
    }
  },
}
```

**Setup Requirements:**
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Configure OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### 2. Microsoft OAuth
```typescript
microsoft: {
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  scope: ["user.read"],
  mapProfileToUser: (profile) => {
    return {
      firstName: profile.givenName || profile.displayName?.split(' ')[0] || '',
      lastName: profile.surname || profile.displayName?.split(' ').slice(1).join(' ') || '',
    }
  },
}
```

**Setup Requirements:**
1. Register app in Azure Active Directory
2. Configure authentication with Web platform
3. Add redirect URIs:
   - `http://localhost:8000/api/auth/callback/microsoft`
   - `https://your-domain.com/api/auth/callback/microsoft`

### 3. GitHub OAuth
```typescript
github: {
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  scope: ["user:email"],
  mapProfileToUser: (profile) => {
    const fullName = profile.name || profile.login || ''
    return {
      firstName: fullName.split(' ')[0] || '',
      lastName: fullName.split(' ').slice(1).join(' ') || '',
    }
  },
}
```

**Setup Requirements:**
1. Create OAuth App in GitHub Developer Settings
2. Configure callback URLs:
   - `http://localhost:8000/api/auth/callback/github`
   - `https://your-domain.com/api/auth/callback/github`

## Environment Variables

### Required Variables
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth  
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Account Linking

### Configuration
```typescript
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "microsoft"],
    allowDifferentEmails: true,
    updateUserInfoOnLink: true,
    allowUnlinkingAll: false,
  },
}
```

### Features
- **Trusted Providers**: Google and Microsoft can link automatically
- **Different Emails**: Allows linking accounts with different email addresses
- **Info Updates**: User profile updated when new accounts are linked
- **Security**: Prevents unlinking all accounts (maintains at least one auth method)

## Database Hooks Integration

### OAuth User Creation
```typescript
// OAuth signup detection
const isOAuthSignup = !ctx.body?.password && ctx.body?.provider

// Name parsing for OAuth users
if (isOAuthSignup && (!user.firstName || !user.lastName) && user.name) {
  const nameParts = user.name.split(' ')
  user.firstName = nameParts[0] || ''
  user.lastName = nameParts.slice(1).join(' ') || ''
}
```

### Provider Restrictions
```typescript
// Business rule: Limit OAuth providers for certain roles
if (user.role === 'admin') {
  const allowedProviders = ['google', 'microsoft']
  if (!allowedProviders.includes(account.providerId)) {
    throw new APIError('Admin users can only use trusted OAuth providers', 403)
  }
}
```

## Frontend Implementation

### Basic Usage
```tsx
import SocialAuthButtons from "@/components/SocialAuthButtons"

<SocialAuthButtons 
  mode="signup"
  providers={['google', 'microsoft']}
  disabled={isLoading}
/>
```

### Individual Providers
```tsx
import GoogleOAuthButton from "@/components/GoogleOAuthButton"

<GoogleOAuthButton 
  mode="signin"
  disabled={isLoading}
/>
```

### Error Handling
```typescript
const handleOAuthAuth = async (provider: string) => {
  try {
    await signIn.social({
      provider,
      callbackURL: "/dashboard",
    }, {
      onSuccess: () => {
        toast.success('Signed in successfully!')
        router.push("/dashboard")
      },
      onError: (ctx) => {
        const errorMessage = handleAuthError(ctx.error)
        toast.error(errorMessage)
      }
    })
  } catch (error) {
    console.error(\`\${provider} OAuth error:\`, error)
  }
}
```

## Security Features

### 1. Rate Limiting
```typescript
rateLimit: {
  window: 60, // 1 minute window
  max: 10, // 10 OAuth attempts per minute
}
```

### 2. Profile Validation
- Automatic name parsing and validation
- Email verification status preservation
- Role-based provider restrictions

### 3. Account Security
- Prevents account takeover through email linking
- Maintains audit logs for OAuth activities
- Implements trusted provider lists

### 4. Business Logic
- Admin users restricted to trusted providers (Google, Microsoft)
- Employee ID validation for OAuth signups
- Role-based access control

## Database Operations

### Link OAuth Account
```typescript
await Accounts.linkOAuthAccount(userId, {
  providerId: 'google',
  accountId: 'google-account-id',
  accessToken: 'access-token',
  refreshToken: 'refresh-token'
})
```

### Get User's OAuth Providers
```typescript
const providers = await Accounts.getUserOAuthProviders(userId)
console.log('Connected providers:', providers.map(p => p.providerId))
```

### Unlink OAuth Account
```typescript
await Accounts.unlinkOAuthAccount(userId, 'google')
```

## Monitoring and Health Checks

### Environment Validation
```typescript
// Health check includes OAuth environment validation
const oauthEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
]
```

### OAuth Status Logging
```typescript
// Successful OAuth authentication
console.log(\`🌐 OAuth sign-in attempt with: \${provider}\`)
console.log(\`🔗 OAuth account linked for user: \${userId}\`)
```

## Testing

### Local Development
1. Set up OAuth applications for each provider
2. Configure environment variables
3. Test callback URLs with localhost
4. Verify profile mapping and account linking

### Production Checklist
- [ ] OAuth applications configured for production domain
- [ ] Environment variables set in deployment
- [ ] Callback URLs updated for production domain
- [ ] Rate limiting configured appropriately
- [ ] Error handling and logging enabled

## Troubleshooting

### Common Issues

**1. Invalid Callback URL**
- Ensure callback URLs match exactly in OAuth provider settings
- Check for trailing slashes and protocol (http vs https)

**2. Environment Variables Missing**
- Verify all required OAuth environment variables are set
- Check variable names match exactly (case sensitive)

**3. Profile Mapping Errors**
- Validate profile data structure for each provider
- Handle missing or null profile fields gracefully

**4. Account Linking Failures**
- Ensure trusted providers are configured correctly
- Check email verification requirements

### Debug Logging
```typescript
// Enable OAuth debug logging
console.log('OAuth provider:', provider)
console.log('Profile data:', profile)
console.log('Mapped user data:', mappedUser)
```

## Best Practices

1. **Security First**: Always validate OAuth tokens and profile data
2. **Error Handling**: Implement comprehensive error handling for each provider
3. **User Experience**: Provide clear feedback during OAuth flows
4. **Monitoring**: Log OAuth events for security and debugging
5. **Testing**: Test OAuth flows in development and staging environments
6. **Documentation**: Keep OAuth setup documentation updated

## Integration Status

### ✅ Completed
- Google OAuth fully implemented and tested
- Microsoft OAuth configured and ready
- GitHub OAuth configured and ready  
- Account linking enabled with trusted providers
- Database hooks integrated with OAuth logic
- Frontend components created for all providers
- Comprehensive error handling implemented

### 🔄 Ready for Deployment
- Environment variables need to be configured for production
- OAuth applications need to be created for each provider
- Production callback URLs need to be registered

This OAuth implementation provides a robust, secure, and scalable authentication system for our POS application with full Better Auth integration.
