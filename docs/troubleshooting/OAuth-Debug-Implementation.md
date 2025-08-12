# OAuth "unable_to_create_user" Debug Implementation

## 🚀 Changes Made

I've implemented comprehensive debugging and fixes for the Google OAuth "unable_to_create_user" error:

### 1. Enhanced Logging in Database Hooks (`/backend/src/lib/database-hooks.ts`)

**Added:**
- Detailed OAuth user creation logging with timestamps and provider info
- Full user data and context logging for debugging
- **Temporarily disabled strict validations** that could block OAuth:
  - Employee ID format validation
  - Terms of service validation

**Why:** These validations might be blocking OAuth users who don't have these fields set.

### 2. Enhanced Google OAuth Configuration (`/backend/src/lib/auth.ts`)

**Added:**
- Detailed Google profile data logging
- Simplified profile mapping that doesn't set problematic fields
- Comprehensive logging of mapped user data

**Key changes:**
- Maps only `firstName` and `lastName` from Google profile
- Doesn't set `employeeId` or `isAgreedToTerms` for OAuth users (auto-handled)

### 3. Enhanced Authentication Hooks (`/backend/src/lib/auth-hooks.ts`)

**Added:**
- Comprehensive OAuth request logging (method, path, body keys)
- Specific OAuth sign-in and callback debugging
- **Error handling for "unable_to_create_user" errors**
- Detailed error logging with timestamps and context

### 4. Debug Tools Created

**Files created:**
- `/backend/src/scripts/test-oauth-debug.ts` - Full OAuth configuration tester
- `/backend/src/scripts/simple-oauth-test.ts` - OAuth user creation flow simulator

### 5. Environment Template

**Created:**
- `.env` file with minimal configuration needed for OAuth testing

## 🔍 How to Debug the Issue

### Step 1: Set Up Environment Variables

Update your `.env` file with real credentials:
```bash
# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret

# Replace with your actual database URL
DATABASE_URL="postgresql://user:password@host:port/database"

# Set a proper secret (32+ characters)
BETTER_AUTH_SECRET=your-actual-32-character-secret-here
```

### Step 2: Restart Development Server

The enhanced logging is now active. Restart your backend server:
```bash
cd backend
npm run dev
```

### Step 3: Try Google OAuth

1. Navigate to your app's login page
2. Click "Sign in with Google"
3. Complete the OAuth flow

### Step 4: Check Console Logs

Look for these specific log messages:

**User Creation Debugging:**
```
🔍 OAuth user creation attempt: { email, timestamp, provider }
🔍 Full user data: { ... }
🔍 Context body: { ... }
🔍 Is OAuth signup: true/false
```

**Google Profile Mapping:**
```
🔍 Google profile data: { ... }
🔍 Mapped user data: { ... }
```

**Authentication Flow:**
```
🌐 Auth request: POST /api/auth/sign-in/social/google
📞 OAuth callback from: google
```

**Error Detection:**
```
❌ OAuth Error: { ... }
🚨 UNABLE TO CREATE USER ERROR DETECTED: { ... }
```

## 🎯 Most Likely Causes & Solutions

### 1. Rate Limiting (Most Common)
**Check logs for:** Rate limiting messages
**Solution:** Wait 5+ minutes between attempts, or check rate limit settings in `/backend/src/lib/rate-limit-config.ts`

### 2. Terms of Service Validation
**Status:** ✅ **TEMPORARILY DISABLED** in our debug version
**Check:** If error persists, this validation was likely the issue

### 3. Employee ID Validation
**Status:** ✅ **TEMPORARILY DISABLED** in our debug version  
**Check:** If error persists, this validation was likely the issue

### 4. Database Connection Issues
**Check logs for:** Database connection errors
**Solution:** Verify `DATABASE_URL` is correct and database is accessible

### 5. Email Already Exists
**Check logs for:** Unique constraint errors
**Solution:** Test with a fresh email address not already in the system

## 📊 Testing Results

The user creation flow simulation shows:
- ✅ All required fields are properly mapped
- ✅ Employee ID is auto-generated in correct format
- ✅ Default role and permissions are set correctly
- ✅ OAuth profile mapping works as expected

## 🚨 Immediate Actions

1. **Set proper environment variables** (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
2. **Restart development server** to activate debug logging
3. **Try OAuth with a fresh email** that's not in your database
4. **Check console logs** for specific error details
5. **Wait 5+ minutes between attempts** to avoid rate limiting

## 🔧 After Testing

Once you identify the root cause:

1. **Re-enable validations** that weren't causing issues
2. **Remove debug logging** for cleaner production logs  
3. **Update environment variables** for production
4. **Test in production** with proper OAuth credentials

The enhanced logging will show exactly which step is failing, making it easy to identify and fix the specific issue causing "unable_to_create_user".

## 📞 Next Steps

After trying OAuth again:
1. Share the specific console log output showing the error
2. We can identify the exact validation causing the issue
3. Implement a targeted fix while keeping necessary validations
