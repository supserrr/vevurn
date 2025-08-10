# OAuth Providers Setup Guide for Vevurn POS

This guide covers setting up OAuth authentication providers for the Vevurn POS system using Better Auth.

## 🎯 Why OAuth for POS Systems?

OAuth authentication provides several benefits for business applications:
- **Enterprise Integration**: Seamlessly integrate with existing Google Workspace, Microsoft 365, or GitHub accounts
- **Simplified Onboarding**: Users don't need to create new passwords
- **Security**: Leverage enterprise-grade security from major providers
- **Account Management**: Centralized user management through existing systems

## 🔧 Supported Providers

### 1. Google OAuth (Recommended)
**Best for**: Google Workspace environments, Gmail users
- **Scopes**: `email`, `profile`
- **Use Cases**: Businesses using Google Workspace, Gmail-based authentication
- **Benefits**: High user adoption, reliable service, good for B2B

### 2. Microsoft OAuth
**Best for**: Office 365 environments, enterprise users
- **Scopes**: `openid`, `profile`, `email`
- **Use Cases**: Businesses using Microsoft 365, Azure AD integration
- **Benefits**: Enterprise integration, advanced security features

### 3. GitHub OAuth (Optional)
**Best for**: Tech-savvy environments, development teams
- **Scopes**: `user:email`
- **Use Cases**: Development shops, tech startups
- **Benefits**: Developer-friendly, secure, good for tech companies

## 📋 Setup Instructions

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google People API" for profile information

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Name: "Vevurn POS Authentication"

4. **Configure Redirect URIs**
   ```
   Development: http://localhost:8000/api/auth/callback/google
   Production: https://yourdomain.com/api/auth/callback/google
   ```

5. **Get Client Credentials**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Microsoft OAuth Setup

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com/
   - Navigate to "Azure Active Directory" > "App registrations"

2. **Register New Application**
   - Click "New registration"
   - Name: "Vevurn POS"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"

3. **Configure Redirect URIs**
   - Go to "Authentication" section
   - Add platform: "Web"
   - Redirect URIs:
   ```
   Development: http://localhost:8000/api/auth/callback/microsoft
   Production: https://yourdomain.com/api/auth/callback/microsoft
   ```

4. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: "Vevurn POS Secret"
   - Expiry: Choose appropriate duration

5. **API Permissions**
   - Go to "API permissions"
   - Add permission: "Microsoft Graph" > "Delegated permissions"
   - Add: `openid`, `profile`, `email`

6. **Get Client Credentials**
   ```bash
   MICROSOFT_CLIENT_ID=your-application-id
   MICROSOFT_CLIENT_SECRET=your-client-secret
   ```

### GitHub OAuth Setup (Optional)

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Click "New OAuth App"

2. **Register Application**
   - Application name: "Vevurn POS"
   - Homepage URL: `https://yourdomain.com` or `http://localhost:3000`
   - Authorization callback URL:
   ```
   Development: http://localhost:8000/api/auth/callback/github
   Production: https://yourdomain.com/api/auth/callback/github
   ```

3. **Get Client Credentials**
   ```bash
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

## 🔐 Environment Configuration

Add these variables to your `.env` file:

```bash
# OAuth Providers Configuration
# Google OAuth (for Google Workspace/Gmail accounts)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth (for Office 365/Outlook accounts)  
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# GitHub OAuth (for developer accounts, optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 📱 Frontend Integration

### Sign In with OAuth

```typescript
// React/Next.js example
import { authClient } from './lib/auth-client'

const signInWithGoogle = async () => {
  try {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard', // Redirect after successful login
    })
  } catch (error) {
    console.error('Google sign-in failed:', error)
    // Handle error (show toast, etc.)
  }
}

const signInWithMicrosoft = async () => {
  try {
    await authClient.signIn.social({
      provider: 'microsoft',
      callbackURL: '/dashboard',
    })
  } catch (error) {
    console.error('Microsoft sign-in failed:', error)
  }
}
```

### Link Additional Accounts

```typescript
// Allow users to link multiple OAuth accounts
const linkGoogleAccount = async () => {
  try {
    await authClient.linkSocial({
      provider: 'google',
    })
    alert('Google account linked successfully!')
  } catch (error) {
    console.error('Failed to link Google account:', error)
  }
}
```

### Request Additional Scopes

```typescript
// Request additional permissions (e.g., Google Drive access)
const requestDriveAccess = async () => {
  try {
    await authClient.linkSocial({
      provider: 'google',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })
    alert('Google Drive access granted!')
  } catch (error) {
    console.error('Failed to get Drive access:', error)
  }
}
```

## 🎨 UI Components

### OAuth Sign-In Buttons

```jsx
// Modern OAuth button components
const OAuthButtons = () => {
  return (
    <div className="space-y-3">
      <button
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </button>
      
      <button
        onClick={signInWithMicrosoft}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <MicrosoftIcon className="w-5 h-5 mr-2" />
        Continue with Microsoft
      </button>
      
      <button
        onClick={signInWithGitHub}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-900 text-sm font-medium text-white hover:bg-gray-800"
      >
        <GitHubIcon className="w-5 h-5 mr-2" />
        Continue with GitHub
      </button>
    </div>
  )
}
```

## 🔒 Security Considerations

### Account Linking Strategy
- **Automatic Linking**: Users with same email across providers are automatically linked
- **Manual Linking**: Users can manually link additional accounts in settings
- **Role Preservation**: OAuth users inherit default roles, admins can adjust later

### Data Mapping
- **Name Handling**: Automatically extracts `firstName` and `lastName` from provider profiles
- **Email Verification**: OAuth emails are considered verified by default
- **Employee ID**: Auto-generated for OAuth users following `EMP-XXXX` format

### Error Handling
- **Invalid Credentials**: Clear error messages with setup instructions
- **Network Issues**: Graceful fallback with retry options
- **Scope Rejections**: Handle partial permission grants appropriately

## 🧪 Testing OAuth Integration

### Development Testing
1. **Set up test OAuth apps** in each provider's developer console
2. **Use localhost URLs** for redirect URIs during development
3. **Test user flows**:
   - New user sign-up via OAuth
   - Existing user sign-in via OAuth
   - Account linking scenarios
   - Error conditions

### Production Deployment
1. **Update redirect URIs** to production URLs
2. **Verify SSL certificates** are properly configured
3. **Test from production domain** before going live
4. **Monitor OAuth success/failure rates**

## 📊 Analytics & Monitoring

### Track OAuth Usage
- **Provider Popularity**: Monitor which OAuth providers are most used
- **Conversion Rates**: Track OAuth vs email/password signup rates
- **Error Rates**: Monitor OAuth authentication failures
- **Account Linking**: Track how many users link multiple accounts

### Useful Metrics
```sql
-- OAuth provider usage
SELECT 
  provider_id, 
  COUNT(*) as user_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM accounts) as percentage
FROM accounts 
WHERE provider_id != 'credential'
GROUP BY provider_id;

-- OAuth vs Email/Password signup
SELECT 
  CASE WHEN provider_id = 'credential' THEN 'Email/Password' ELSE 'OAuth' END as auth_type,
  COUNT(*) as user_count
FROM accounts
GROUP BY auth_type;
```

## 🔄 Migration & Maintenance

### Adding New Providers
1. Update Better Auth configuration with new provider
2. Add environment variables for client credentials
3. Update frontend components with new sign-in options
4. Test thoroughly in development
5. Deploy with feature flags for gradual rollout

### Maintaining OAuth Apps
- **Regularly rotate client secrets** (recommended: every 6-12 months)
- **Monitor provider API changes** and update accordingly
- **Review and update scopes** as needed
- **Maintain redirect URI lists** for different environments

## 🚨 Troubleshooting

### Common Issues

**"Invalid Client" Errors**
- Check client ID and secret are correct
- Verify redirect URIs match exactly
- Ensure OAuth app is enabled in provider console

**Scope Permission Errors**
- Check requested scopes are approved in OAuth app
- Verify user granted all requested permissions
- Review provider-specific scope requirements

**Redirect URI Mismatches**
- Ensure redirect URIs in provider console match Better Auth callback URLs
- Check for trailing slashes or protocol mismatches
- Verify environment-specific URLs are configured

## 📚 Related Documentation
- [Better Auth OAuth Concepts](https://better-auth.com/docs/concepts/oauth)
- [Generic OAuth Plugin](https://better-auth.com/docs/plugins/generic-oauth)
- [Users & Accounts](https://better-auth.com/docs/concepts/users-accounts)

---

*OAuth implementation completed on August 8, 2025. Ready for production use with proper provider setup.*
