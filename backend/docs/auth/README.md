# Authentication Documentation

This directory contains comprehensive documentation for authentication and authorization in the Vevurn POS Backend.

## Overview

The backend uses **Better Auth** for authentication, providing:

- Email/Password authentication
- Google OAuth integration
- Session management
- Rate limiting protection
- Database integration with Prisma

## Contents

### Core Implementation
- `BETTER_AUTH_COMPLETE_IMPLEMENTATION.md` - Complete Better Auth setup
- `BETTER_AUTH_EXPRESS_INTEGRATION.md` - Express.js integration guide
- `EXPRESS_INTEGRATION_COMPLETE.md` - Complete Express integration

### Database Integration
- `BETTER_AUTH_DATABASE_IMPLEMENTATION.md` - Database setup and configuration
- `BETTER_AUTH_DATABASE_UPDATE.md` - Database schema updates
- `BETTER_AUTH_HOOKS_IMPLEMENTATION.md` - Database hooks and triggers

### OAuth & Social Login
- `BETTER_AUTH_OAUTH.md` - OAuth configuration
- `GOOGLE_OAUTH_SETUP_GUIDE.md` - Google OAuth setup
- `OAUTH_IMPLEMENTATION_COMPLETE.md` - Complete OAuth implementation

### Security & Enhancement
- `ENHANCED_AUTH_INTEGRATION_GUIDE.md` - Enhanced security features
- `ENHANCED_AUTH_README.md` - Enhanced authentication overview
- `ENHANCED_SECURITY_INTEGRATION_GUIDE.md` - Security best practices
- `BETTER_AUTH_RATE_LIMITING.md` - Rate limiting configuration
- `RATE_LIMITING_COMPLETE.md` - Complete rate limiting implementation

### Email Authentication
- `EMAIL_PASSWORD_AUTH_COMPLETE.md` - Email/password authentication

### Project Organization
- `BETTER_AUTH_PROJECT_ORGANIZATION.md` - Project structure and organization

## Authentication Endpoints

The backend provides these authentication endpoints:

- `POST /api/auth/sign-up/email` - Email signup
- `POST /api/auth/sign-in/email` - Email signin
- `GET /api/auth/sign-in/social/google` - Google OAuth
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/get-session` - Get current session
- `GET /api/auth-status` - Authentication status (custom endpoint)

## Quick Setup

1. **Configure Environment Variables:**
   ```bash
   DATABASE_URL=your_database_url
   BETTER_AUTH_SECRET=your_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

2. **Test Authentication:**
   ```bash
   # Test auth status
   curl http://localhost:8001/api/auth-status
   
   # Test signup endpoint
   curl -X POST http://localhost:8001/api/test/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password","firstName":"Test","lastName":"User"}'
   ```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ Session-based authentication
- ✅ CSRF protection
- ✅ Rate limiting on auth endpoints
- ✅ Email verification
- ✅ OAuth integration
- ✅ Secure cookie handling
