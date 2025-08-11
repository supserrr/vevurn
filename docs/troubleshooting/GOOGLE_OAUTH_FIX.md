# Google OAuth Setup Guide - Fix "OAuth client not found" Error

## Issue: Google OAuth Not Configured ❌

The error `"The OAuth client was not found. Error 401: invalid_client"` occurs because Google OAuth credentials are not properly configured.

**Current Status:**
- ❌ Google Client ID: `your-google-client-id.apps.googleusercontent.com` (placeholder)
- ❌ Google Client Secret: `your-google-client-secret` (placeholder)
- ❌ Production: Google OAuth not available
- ❌ Development: Using placeholder credentials

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

## Step 3: Verify Configuration

### 3.1 Local Testing
1. Restart development server: `npm run dev`
2. Check logs for: `✅ Google OAuth: CONFIGURED`
3. Test at: http://localhost:3000/login

### 3.2 Production Testing  
1. After Render deployment completes
2. Test at: https://vevurn.onrender.com/login
3. Google sign-up button should work

## Step 4: Test OAuth Flow

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

1. **Create Google OAuth app** in Google Cloud Console
2. **Get real credentials** (not placeholders)
3. **Update .env file** with actual Client ID and Secret  
4. **Add to Render environment** variables
5. **Restart/Deploy** both local and production

Once configured, Google OAuth will work seamlessly! 🚀

## Security Notes
- Keep Client Secret private (never commit to git)
- Use environment variables only
- Test on both localhost and production domains
- Verify redirect URIs match exactly
