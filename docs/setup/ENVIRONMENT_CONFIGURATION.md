# Environment Configuration Guide

This guide explains how to properly configure environment variables for the Vevurn POS System.

## 📁 Environment Files Structure

```
vevurn/
├── .env.example                    # Template with all possible variables
├── backend/.env                    # Backend environment configuration
└── frontend/.env.local            # Frontend environment configuration
```

## 🚀 Quick Setup

### 1. Backend Configuration
```bash
cd backend
cp ../.env.example .env
# Edit .env with your actual values
```

### 2. Frontend Configuration
```bash
cd frontend
# Create .env.local with frontend-specific variables
```

## 🔧 Configuration Categories

### Core Application Settings
- `NODE_ENV`: Environment (development/production)
- `PORT`: Backend server port
- `FRONTEND_URL` / `BACKEND_URL`: Application URLs

### Database Configuration
- `DATABASE_URL`: PostgreSQL connection string
- Production uses Render PostgreSQL
- Development can use local PostgreSQL

### Authentication & Security
- `BETTER_AUTH_SECRET`: Base64 encoded secret (32 chars)
- `JWT_SECRET`: JWT token signing key
- `ENCRYPTION_KEY`: Data encryption key
- OAuth provider credentials (Google, Microsoft, GitHub)

### External Services
- **Redis**: Caching and session storage
- **AWS S3**: File storage and uploads
- **SMTP**: Email notifications
- **MTN MoMo**: Mobile money payments (Rwanda)

### Performance & Monitoring
- Logging configuration
- Rate limiting settings
- Metrics and monitoring

## 🔒 Security Best Practices

### Secret Generation
```bash
# Generate Better Auth secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64

# Generate encryption key
openssl rand -base64 32
```

### Environment-Specific Settings

#### Development
```bash
NODE_ENV=development
BETTER_AUTH_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Production
```bash
NODE_ENV=production
BETTER_AUTH_URL=https://your-backend.onrender.com
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## 📋 Required Variables

### Minimal Backend Setup
```bash
NODE_ENV=development
PORT=8000
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
BETTER_AUTH_SECRET="..."
JWT_SECRET="..."
```

### Minimal Frontend Setup
```bash
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🔄 Service-Specific Configuration

### MTN Rwanda Mobile Money
1. Register at [MTN Developer Portal](https://momodeveloper.mtn.co.rw/)
2. Get subscription keys
3. Create API user via MTN API
4. Configure webhook URL

### AWS S3 File Storage
1. Create AWS account and S3 bucket
2. Create IAM user with S3 permissions
3. Generate access keys
4. Configure bucket policy

### Email (SMTP)
1. Use Gmail app passwords or dedicated SMTP service
2. Configure SMTP settings
3. Set sender information

## ❌ Common Issues

### Authentication Issues
- Ensure `BETTER_AUTH_SECRET` matches between frontend and backend
- Verify `BETTER_AUTH_URL` points to backend correctly

### Database Connection
- Check `DATABASE_URL` format
- Ensure database is accessible
- Verify credentials and permissions

### CORS Errors
- Add frontend URL to `CORS_ORIGINS`
- Check `FRONTEND_URL` configuration

## 🚨 Security Warnings

- **Never commit real environment files to version control**
- **Use different secrets for different environments**
- **Regularly rotate API keys and passwords**
- **Use strong, unique passwords**
- **Enable 2FA on all service accounts**

## 📖 Related Documentation

- `/docs/setup/ENVIRONMENT_SETUP.md` - Detailed setup instructions
- `/docs/auth/BETTER_AUTH_SETUP.md` - Authentication configuration
- `/deployment/` - Production deployment guides
