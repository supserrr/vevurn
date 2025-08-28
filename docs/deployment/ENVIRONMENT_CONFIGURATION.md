# Environment Configuration Guide

This guide provides proper environment configuration for both development and production deployments.

## Port Configuration Summary

- **Backend**: http://localhost:8000 (development) / Production port from environment
- **Frontend**: http://localhost:3000 (development) / Production port from environment

## Development Environment (.env)

Create a `.env` file in the backend directory with these values:

```bash
# Application
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
HOSTNAME=localhost

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vevurn_pos
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vevurn_pos
POSTGRES_USER=username
POSTGRES_PASSWORD=password

# Authentication
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:8000
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-refresh-secret-here
REFRESH_TOKEN_EXPIRE=7d
SESSION_SECRET=your-session-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
DEVICE_SECRET=your-device-secret-here
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGINS=http://localhost:3000

# Security
TRUSTED_PROXIES=127.0.0.1,::1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,csv,xlsx

# Logging
LOG_LEVEL=info
LOG_TO_FILE=false
ENABLE_METRICS=false

# Development Flags
DEBUG_MODE=true
ENABLE_API_DOCS=true
ENABLE_CORS_CREDENTIALS=true
```

## Production Environment

For production deployments, ensure these configurations:

### Backend Environment Variables

```bash
# Application
NODE_ENV=production
PORT=8000  # or from process.env.PORT
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
HOSTNAME=0.0.0.0

# Database (from your hosting provider)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Authentication (generate secure random keys)
BETTER_AUTH_SECRET=secure-32-character-secret-key
BETTER_AUTH_URL=https://your-backend-domain.com
JWT_SECRET=secure-jwt-secret
JWT_REFRESH_SECRET=secure-refresh-secret
SESSION_SECRET=secure-session-secret
ENCRYPTION_KEY=secure-32-character-encryption-key
DEVICE_SECRET=secure-device-secret
BCRYPT_ROUNDS=12

# CORS (your frontend domain)
CORS_ORIGINS=https://your-frontend-domain.com

# Security
TRUSTED_PROXIES=127.0.0.1,::1,10.0.0.0/8

# Rate Limiting (stricter for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Logging
LOG_LEVEL=warn
LOG_TO_FILE=true
ENABLE_METRICS=true

# Production Flags
DEBUG_MODE=false
ENABLE_API_DOCS=false
ENABLE_CORS_CREDENTIALS=true
```

### Frontend Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (update with your domains)
# NEXT_PUBLIC_API_URL=https://your-backend-domain.com
# NEXT_PUBLIC_WS_URL=https://your-backend-domain.com
# NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

## Deployment Platform Configurations

### Render.com

The `backend/render.yaml` file is configured with the correct port (8000).

### Vercel (Frontend)

```bash
# Environment Variables in Vercel Dashboard
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_WS_URL=https://your-backend-domain.com
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

### Railway

```bash
# Railway Environment Variables
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-railway-app.railway.app
DATABASE_URL=postgresql://... # Auto-provided by Railway
```

### Docker

For Docker deployments, the port configuration is handled through:

```dockerfile
# Dockerfile
EXPOSE 8000
ENV PORT=8000
```

```yaml
# docker-compose.yml
services:
  backend:
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - FRONTEND_URL=http://localhost:3000
      
  frontend:
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Port Conflict Resolution

If you encounter port conflicts:

### Check what's using the ports:
```bash
# Check port 8000
lsof -i :8000

# Check port 3000
lsof -i :3000

# Kill processes if needed
kill -9 $(lsof -ti:8000)
kill -9 $(lsof -ti:3000)
```

### Alternative ports (if needed):
```bash
# Backend on alternative port
PORT=8001 npm run dev:backend

# Frontend on alternative port
npm run dev:frontend -- -p 3001
```

## Verification

After configuration, verify the setup:

1. **Backend Health Check**: `curl http://localhost:8000/api/health`
2. **Frontend Access**: Visit `http://localhost:3000`
3. **API Communication**: Check browser network tab for API calls to port 8000

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Enable HTTPS in production
- Configure proper CORS origins
- Use environment-specific database credentials
- Monitor and log all production deployments
