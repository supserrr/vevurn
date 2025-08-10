# Render Deployment Guide - Vevurn POS

This guide explains how to deploy your Vevurn POS system to Render using the provided `render.yaml` blueprint.

## 🚀 Quick Deploy

1. **Fork/Clone** this repository to your GitHub account
2. **Connect to Render**: Go to [render.com](https://render.com) and connect your GitHub account
3. **Create Blueprint**: Click "New" → "Blueprint" and select your repository
4. **Deploy**: Render will automatically read `render.yaml` and provision all services

## 📋 Infrastructure Overview

The deployment creates:

### Services
- **Backend API** (`vevurn-backend`) - Node.js Express server on port 3001
- **Frontend** (`vevurn-frontend`) - Next.js application on port 3000
- **PostgreSQL Database** (`vevurn-postgres`) - Managed database
- **Redis Cache** (`vevurn-redis`) - In-memory data store

### Automatic Configuration
- Environment variables are automatically configured
- Database connection strings are injected
- Redis URLs are linked between services
- Health checks are enabled for monitoring

## 🔧 Pre-Deployment Setup

### 1. Update Package Scripts

Ensure your `package.json` files have the correct scripts:

**Backend (`backend/package.json`)**:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  }
}
```

**Frontend (`frontend/package.json`)**:
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev"
  }
}
```

### 2. Create Health Check Endpoint

Add to your backend (`src/index.ts` or similar):

```typescript
// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'vevurn-backend'
  });
});
```

### 3. Database Migrations

Create a migration script in `backend/package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "npm run migrate && node dist/index.js",
    "migrate": "npx prisma migrate deploy",
    "dev": "tsx watch src/index.ts"
  }
}
```

Or create a separate build hook in `render.yaml`:

```yaml
services:
  - type: web
    name: vevurn-backend
    buildCommand: cd backend && npm ci && npm run build && npx prisma migrate deploy
```

## 🔐 Environment Variables

### Automatic Variables
These are configured automatically by the blueprint:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Auto-generated secure secret
- `JWT_REFRESH_SECRET` - Auto-generated secure secret
- `BETTER_AUTH_SECRET` - Auto-generated secure secret

### Manual Configuration Required
Add these through the Render dashboard after deployment:

**AWS S3 Configuration** (if using file uploads):
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=vevurn-uploads
```

**Optional Email Configuration**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 🔗 Service URLs

After deployment, your services will be available at:

- **Backend API**: `https://vevurn-backend.onrender.com`
- **Frontend**: `https://vevurn-frontend.onrender.com`
- **API Endpoints**: 
  - Auth: `https://vevurn-backend.onrender.com/api/auth`
  - Products: `https://vevurn-backend.onrender.com/api/products`
  - Sales: `https://vevurn-backend.onrender.com/api/sales`

## 📊 Scaling Configuration

### Starter Plan (Free Tier)
Current configuration uses `starter` plan for all services:
- Web Services: 512 MB RAM, shared CPU
- Database: 1 GB storage, 1 connection
- Redis: 25 MB memory

### Production Plan
For production, update plans in `render.yaml`:

```yaml
# Change from 'starter' to 'standard'
services:
  - type: web
    plan: standard  # $7/month - 1 GB RAM, 1 CPU
    
databases:
  - plan: standard  # $7/month - 1 GB storage, 10 connections
  
services:
  - type: redis
    plan: standard  # $7/month - 256 MB memory
```

### High-Traffic Configuration
For high-traffic applications:

```yaml
services:
  - type: web
    plan: pro  # $25/month - 2 GB RAM, 2 CPU
    
databases:
  - plan: pro  # $25/month - 4 GB storage, 25 connections
  
services:
  - type: redis
    plan: pro  # $25/month - 1 GB memory
```

## 🔍 Monitoring & Debugging

### Health Checks
Render automatically monitors the `/health` endpoint and will restart services if they become unhealthy.

### Logs Access
View logs in the Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Monitor real-time logs and errors

### Database Management
Access your PostgreSQL database:
1. Go to database service in dashboard
2. Copy connection string
3. Use with database management tools like pgAdmin or DBeaver

### Redis Monitoring
Monitor Redis performance:
1. Check Redis service logs
2. Use Redis CLI commands through the dashboard
3. Monitor memory usage and eviction policies

## 🚨 Common Issues & Solutions

### Build Failures

**Issue**: "Module not found" during build
**Solution**: Ensure all dependencies are in `package.json` and run `npm ci` locally to verify

**Issue**: TypeScript compilation errors
**Solution**: Fix TypeScript errors locally first, ensure `tsconfig.json` is properly configured

### Runtime Issues

**Issue**: "Connection refused" database errors
**Solution**: Verify `DATABASE_URL` is correctly configured and database service is running

**Issue**: Redis connection timeouts
**Solution**: Check Redis service status and verify `REDIS_URL` environment variable

### Deployment Issues

**Issue**: Service won't start
**Solution**: Check logs for specific errors, verify health check endpoint returns 200 status

**Issue**: Environment variables not working
**Solution**: Verify variable names match exactly in `render.yaml` and your application code

## 🔄 Continuous Deployment

Render automatically deploys when you push to your main branch:

1. **Push code** to GitHub
2. **Render detects** changes
3. **Builds and deploys** automatically
4. **Health checks** verify deployment

### Manual Deploy
Force a manual deployment:
1. Go to service dashboard
2. Click "Manual Deploy"
3. Select "Deploy latest commit"

## 🛠️ Local Development

Keep your local environment in sync:

```bash
# Install dependencies
pnpm install

# Set up local environment
cp .env.example .env

# Run development servers
pnpm dev
```

Local environment variables:
```env
# Local Development
DATABASE_URL=postgresql://username:password@localhost:5432/vevurn_pos
REDIS_URL=redis://localhost:6379
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📈 Performance Optimization

### Backend Optimization
- Enable gzip compression
- Implement proper caching headers
- Use connection pooling for database
- Enable Redis persistent connections

### Frontend Optimization
- Enable Next.js image optimization
- Configure proper caching for static assets
- Use ISR (Incremental Static Regeneration) where appropriate
- Implement service worker for offline capabilities

### Database Optimization
- Add proper indexes for frequently queried fields
- Enable connection pooling
- Use read replicas for heavy read workloads (higher plans)
- Regular database maintenance and VACUUM operations

This deployment configuration provides a solid foundation for running your Vevurn POS system in production with proper scaling, monitoring, and security considerations.
