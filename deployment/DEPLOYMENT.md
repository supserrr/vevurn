# Render Deployment Guide

This guide explains how to deploy the Vevurn POS system components separately on Render.

## Deployment Options

### Option 1: All Services Together (Recommended for Development)
Use the main `render.yaml` file to deploy all services together:
```bash
# This will deploy: Backend + Frontend + Database + Redis
render blueprint deploy render.yaml
```

### Option 2: Backend Only (For Production Backend)
Use the backend-specific configuration:
```bash
# This will deploy: Backend + Database + Redis only
render blueprint deploy render-backend.yaml
```

### Option 3: Frontend Only (For Production Frontend)
Use the frontend-specific configuration:
```bash
# This will deploy: Frontend only (connects to existing backend)
render blueprint deploy render-frontend.yaml
```

## Service Isolation Features

### ✅ Build Isolation
- **Backend Build**: Uses `build-backend.sh` - only builds shared + backend
- **Frontend Build**: Uses `build-frontend.sh` - only builds shared + frontend  
- **Generic Build**: Uses `build.sh` - auto-detects service type

### ✅ Environment Separation  
- Each service has `SERVICE_TYPE` environment variable
- Backend runs on port 3001, Frontend on port 3000
- Services have separate health check endpoints

### ✅ Dependency Isolation
- Backend includes: API, Database, Redis, Auth services
- Frontend includes: Only the Next.js application
- No circular dependencies between services

### ✅ Independent Scaling
- Scale backend and frontend independently
- Database can be shared across multiple backend instances
- Redis cache shared across backend instances

## Environment Variables

### Backend Environment Variables
```yaml
NODE_ENV: production
SERVICE_TYPE: backend
PORT: 3001
DATABASE_URL: (auto-generated from database)
REDIS_URL: (auto-generated from redis)
JWT_SECRET: (auto-generated)
BETTER_AUTH_SECRET: (auto-generated)
BETTER_AUTH_URL: https://vevurn-backend.onrender.com
FRONTEND_URL: https://vevurn-frontend.onrender.com
```

### Frontend Environment Variables  
```yaml
NODE_ENV: production
SERVICE_TYPE: frontend
PORT: 3000
NEXT_PUBLIC_API_URL: https://vevurn-backend.onrender.com
BETTER_AUTH_URL: https://vevurn-backend.onrender.com
```

## Deployment Order

For production deployments, follow this order:

1. **Deploy Backend First**
   ```bash
   render blueprint deploy render-backend.yaml
   ```
   
2. **Wait for Backend to be Live**
   - Verify at: https://vevurn-backend.onrender.com/health
   
3. **Deploy Frontend**
   ```bash
   render blueprint deploy render-frontend.yaml
   ```

## Health Check Endpoints

- **Backend**: `https://vevurn-backend.onrender.com/health`
- **Frontend**: `https://vevurn-frontend.onrender.com` (Next.js default health)

## Rollback Strategy

Each service can be rolled back independently:
- Backend rollback won't affect frontend
- Frontend rollback won't affect backend
- Database and Redis are shared resources (careful with schema changes)

## Troubleshooting

### Build Issues
- Check service-specific build logs
- Verify environment variables are set correctly
- Ensure pnpm workspace is working correctly

### Runtime Issues  
- Check health endpoints
- Verify inter-service communication URLs
- Check database connectivity from backend

### Performance Issues
- Scale backend and frontend independently
- Monitor database connection pool usage
- Check Redis cache hit rates
