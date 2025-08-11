# Google OAuth Setup Guide - Fix "OAuth client not found" Error

## Issue: Google OAuth Not Configured ❌

The error `"The OAuth client was not found. Error 401: invalid_client"` occurs because Google OAuth credentials are not properly configured.

**Current Status:**
- ❌ Google Client ID: Not configured (commented out)
- ❌ Google Client Secret: Not configured (commented out)
- ❌ Production: Google OAuth not available
- ❌ Development: Google OAuth disabled

## 🚀 Quick Setup (Recommended)

### Option 1: Automated Setup Script
Run the automated setup script that will guide you through the entire process:

```bash
cd /Users/password/vevurn
./scripts/setup-google-oauth.sh
```

This script will:
- ✅ Guide you through Google Cloud Console setup
- ✅ Configure environment variables automatically  
- ✅ Validate your configuration
- ✅ Provide testing instructions

### Option 2: Manual Setup (Detailed)

## Step 1: Create Google OAuth Application

### 1.1 Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project or create a new one: `vevurnPOS`

### 1.2 Enable Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "People API"
3. Click **Enable**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
3. Configure OAuth consent screen if prompted:
   - **Application name**: `vevurnPOS`
   - **User support email**: Your email
   - **Authorized domains**: `vevurn.onrender.com`, `localhost`

### 1.4 Configure OAuth Client
**Application type**: Web application

**Authorized JavaScript origins:**
```
https://vevurn.onrender.com
http://localhost:3000
http://localhost:8000
```

**Authorized redirect URIs:**
```
https://vevurn.onrender.com/api/auth/callback/google
http://localhost:8000/api/auth/callback/google
```

### 1.5 Get Credentials
After creation, you'll receive:
- **Client ID**: `123456789-abcdef.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdef123456789`

## Step 2: Configure Environment Variables

### 2.1 Local Development
Update `/Users/password/vevurn/backend/.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

### 2.2 Production (Render)
1. Go to **Render Dashboard** → **vevurn service** → **Environment**
2. Add these environment variables:
   - `GOOGLE_CLIENT_ID` = `your-actual-client-id`
   - `GOOGLE_CLIENT_SECRET` = `your-actual-client-secret`
3. **Deploy** to activate changes

## Step 3: Database Setup (Already Complete ✅)

Your database schema is already fully compatible with Better Auth OAuth! The following tables exist and are properly configured:

- ✅ `users` - User accounts with OAuth support
- ✅ `sessions` - User sessions management  
- ✅ `accounts` - OAuth account linking
- ✅ `verification_tokens` - Email verification

**Optional**: Run the migration to add performance indexes:
```bash
cd /Users/password/vevurn/backend
psql $DATABASE_URL -f database/migrations/better_auth_oauth_setup.sql
```

## Step 4: Verify Configuration

### 4.1 Validation Script
Run the automated validation:
```bash
cd /Users/password/vevurn
./scripts/validate-google-oauth.sh
```

### 4.2 Local Testing
1. Restart development server: `npm run dev`
2. Check logs for: `✅ Google OAuth: CONFIGURED`
3. Test at: http://localhost:3000/login

### 4.3 Production Testing  
1. After Render deployment completes
2. Test at: https://vevurn.onrender.com/login
3. Google sign-up button should work

## Step 5: Test OAuth Flow

### Expected Flow:
1. Click "Sign up with Google"
2. Redirect to Google OAuth consent screen
3. User grants permission
4. Redirect back to your app with user data
5. User account created automatically with Google profile data

### Troubleshooting:
- **"OAuth client not found"** → Check Client ID is correct
- **"redirect_uri_mismatch"** → Add redirect URI to Google Console
- **"access_blocked"** → Check OAuth consent screen configuration
- **"failed to create user"** → Database schema is compatible ✅

## Current Better Auth Configuration ✅

Your Better Auth is properly configured for Google OAuth:

```typescript
google: {
  clientId: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  scope: ["email", "profile"],
  accessType: "offline",
  prompt: "select_account+consent",
  mapProfileToUser: (profile) => {
    return {
      firstName: profile.given_name || profile.name?.split(' ')[0] || '',
      lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
    }
  },
}
```

## Quick Fix Summary

1. **🚀 Run setup script**: `./scripts/setup-google-oauth.sh` (Recommended)
2. **🔍 Validate config**: `./scripts/validate-google-oauth.sh`
3. **🔄 Restart servers**: `npm run dev`
4. **🧪 Test locally**: http://localhost:3000/login
5. **🌐 Deploy to production**: Add env vars to Render

## Available Scripts

- `./scripts/setup-google-oauth.sh` - Automated Google OAuth setup
- `./scripts/validate-google-oauth.sh` - Configuration validation
- `./scripts/fix-google-oauth.sh` - Enable/disable Google OAuth

## Security Notes
- Keep Client Secret private (never commit to git)
- Use environment variables only
- Test on both localhost and production domains
- Verify redirect URIs match exactly

## Status After Setup

Once configured, Google OAuth will work seamlessly with:
- ✅ User registration via Google account
- ✅ Automatic profile data mapping (firstName, lastName)  
- ✅ Session management
- ✅ Account linking
- ✅ Secure token storage

🎉 Your vevurnPOS will be fully OAuth-enabled!
