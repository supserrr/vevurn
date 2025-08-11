# User Registration Issue - Troubleshooting Guide

## Issue Identified: ✅ Rate Limiting on Production

### Root Cause
The user registration is failing on production due to **strict rate limiting** configured for the `/api/auth/sign-up/email` endpoint:

- **Rate Limit**: Only **3 signup attempts per 5 minutes** per IP address
- **Environment**: Production has stricter limits than development
- **Storage**: Redis-backed rate limiting is working correctly

### Current Rate Limit Configuration
```typescript
"/sign-up/email": {
  window: 300, // 5 minutes
  max: 3, // Only 3 signup attempts per 5 minutes in production
}
```

## Solutions

### 1. ✅ Immediate Solution: Wait for Rate Limit Reset
- **Wait Time**: 5-15 minutes after last attempt
- **Status Check**: Test with: `curl -s https://vevurn.onrender.com/health`
- **Retry**: Use different email or wait for window to reset

### 2. 🔧 Development Solution: Test Locally
- **Local Server**: `npm run dev` in `/backend` directory
- **Local URL**: `http://localhost:3000/login`
- **Rate Limits**: More generous in development (9 attempts per 5 minutes)

### 3. ⚙️  Production Solution: Adjust Rate Limits (Optional)
If legitimate users are being blocked, consider increasing limits in `/backend/src/lib/rate-limit-config.ts`:

```typescript
"/sign-up/email": {
  window: 300, // 5 minutes
  max: 5, // Increase from 3 to 5 attempts
}
```

## Required Registration Fields

✅ **All registration requests must include:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "First", // REQUIRED
  "lastName": "Last",   // REQUIRED
  "name": "First Last"  // Auto-generated from firstName + lastName
}
```

❌ **Common Errors:**
- Missing `firstName` or `lastName` → "First name and last name are required for POS system registration"
- Rate limit exceeded → "Too many requests. Please try again later."
- Invalid employee ID format → "Employee ID must follow format EMP-XXXX"

## Testing Status

### ✅ Local Development
- Backend: Running on `http://localhost:8000`
- Frontend: Running on `http://localhost:3000`
- Registration: Working with proper fields
- Rate Limits: More generous (development environment)

### ✅ Production
- Application: Running on `https://vevurn.onrender.com`
- Health Check: All services operational
- Rate Limiting: Active and protecting against abuse
- Registration: Works when not rate-limited

## Next Steps

1. **For Testing**: Use local development server
2. **For Production Users**: Wait for rate limit reset (5-15 minutes)
3. **For Future**: Consider adjusting production rate limits if too restrictive

## Verification

To verify registration is working, test locally at:
- **Frontend**: http://localhost:3000/login (signup tab)
- **Backend**: http://localhost:8000/api/auth/sign-up/email (direct API)

Both frontend and backend servers are currently running and ready for testing! 🚀
