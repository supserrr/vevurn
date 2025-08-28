# 🚀 Vevurn POS Deployment Guide

This guide covers deploying the Vevurn POS system to production using **Render** for the backend and **Vercel** for the frontend.

## 📋 **Prerequisites**

- GitHub repository with your code
- Render account (for backend + database)
- Vercel account (for frontend)
- Gmail account or SMTP service (for emails)
- AWS account (for file uploads - optional)

---

## 🗄️ **Step 1: Database Setup (Render PostgreSQL)**

### 1.1 Create PostgreSQL Database

1. **Go to Render Dashboard** → **New** → **PostgreSQL**
2. **Configure Database:**
   - **Name**: `vevurn-pos-db`
   - **Database Name**: `vevurn_pos`
   - **User**: `vevurn_user`
   - **Region**: Choose closest to your users
   - **Plan**: `Starter` (free) or `Standard` (production)

3. **Note the Connection Details:**
   ```
   Internal Database URL: postgresql://vevurn_user:password@hostname/vevurn_pos
   External Database URL: postgresql://vevurn_user:password@external-hostname/vevurn_pos
   ```

### 1.2 Run Database Migrations

After database is created, you'll run migrations from your backend service.

---

## 🖥️ **Step 2: Backend Deployment (Render)**

### 2.1 Connect Repository

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect your GitHub repository**
3. **Select the repository**: `your-username/vevurn`

### 2.2 Configure Service

```yaml
Name: vevurn-pos-backend
Region: Oregon (or your preferred region)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 2.3 Environment Variables

Add these environment variables in Render dashboard:

```bash
# Application
NODE_ENV=production
PORT=8000
HOSTNAME=0.0.0.0

# Database (use the Internal Database URL from Step 1)
DATABASE_URL=postgresql://vevurn_user:password@hostname/vevurn_pos

# Authentication (generate a 32+ character secret)
BETTER_AUTH_SECRET=your-super-secret-32-character-minimum-secret-here
BETTER_AUTH_URL=https://vevurn-pos-backend.onrender.com

# CORS (will be your Vercel frontend URL)
CORS_ORIGINS=https://vevurn-pos.vercel.app

# Email Service (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@vevurnpos.com
SMTP_SECURE=false

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=vevurn-pos-assets

# Logging
LOG_LEVEL=info

# Frontend URL (will be your Vercel URL)
FRONTEND_URL=https://vevurn-pos.vercel.app
```

### 2.4 Deploy Backend

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 5-10 minutes)
3. **Note your backend URL**: `https://vevurn-pos-backend.onrender.com`

### 2.5 Run Database Migrations

After successful deployment:

1. **Go to Render Dashboard** → **Your Backend Service** → **Shell**
2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## 🌐 **Step 3: Frontend Deployment (Vercel)**

### 3.1 Connect Repository

1. **Go to Vercel Dashboard** → **New Project**
2. **Import from GitHub**: Select your repository
3. **Configure Project:**
   ```
   Framework Preset: Next.js
   Root Directory: frontend/apps/web
   ```

### 3.2 Environment Variables

Add these in Vercel dashboard (**Settings** → **Environment Variables**):

```bash
# Backend API URL (your Render backend URL)
NEXT_PUBLIC_API_URL=https://vevurn-pos-backend.onrender.com

# WebSocket URL (same as API URL)
NEXT_PUBLIC_WS_URL=https://vevurn-pos-backend.onrender.com

# Application URL (will be your Vercel domain)
NEXT_PUBLIC_APP_URL=https://vevurn-pos.vercel.app

# Environment
NODE_ENV=production
```

### 3.3 Deploy Frontend

1. **Click "Deploy"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Note your frontend URL**: `https://vevurn-pos.vercel.app`

### 3.4 Update Backend CORS

1. **Go back to Render** → **Your Backend Service** → **Environment**
2. **Update CORS_ORIGINS** with your actual Vercel URL:
   ```bash
   CORS_ORIGINS=https://your-actual-vercel-url.vercel.app
   ```
3. **Redeploy backend service**

---

## 🔧 **Step 4: Final Configuration**

### 4.1 Update Environment Variables

**Backend (Render):**
- Update `FRONTEND_URL` with your actual Vercel URL
- Update `CORS_ORIGINS` with your actual Vercel URL

**Frontend (Vercel):**
- Update `NEXT_PUBLIC_API_URL` with your actual Render URL
- Update `NEXT_PUBLIC_WS_URL` with your actual Render URL

### 4.2 Test the Deployment

1. **Visit your frontend URL**
2. **Test user registration/login**
3. **Test business onboarding**
4. **Test cashier creation**
5. **Test POS functionality**
6. **Verify email notifications work**
7. **Check real-time notifications**

---

## 📧 **Step 5: Email Configuration**

### 5.1 Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate password for "Mail"
3. **Use in environment variables:**
   ```bash
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### 5.2 Alternative SMTP Providers

- **SendGrid**: Professional email service
- **Mailgun**: Developer-friendly email API
- **Amazon SES**: Cost-effective email service

---

## 🔐 **Step 6: Security Checklist**

### 6.1 Environment Variables
- [ ] All secrets are properly set
- [ ] BETTER_AUTH_SECRET is 32+ characters
- [ ] Database URL uses internal connection
- [ ] CORS origins are restricted to your domain

### 6.2 Database Security
- [ ] Database user has minimum required permissions
- [ ] Connection uses SSL (automatic with Render)
- [ ] Regular backups are enabled

### 6.3 Application Security
- [ ] HTTPS is enabled (automatic with Render/Vercel)
- [ ] Security headers are configured
- [ ] File uploads are validated and scanned

---

## 📊 **Step 7: Monitoring & Maintenance**

### 7.1 Health Checks
- Backend health endpoint: `https://your-backend.onrender.com/api/health`
- Monitor uptime and response times

### 7.2 Logs
- **Render**: View logs in dashboard
- **Vercel**: View function logs in dashboard
- **Database**: Monitor query performance

### 7.3 Backups
- **Database**: Render provides automated backups
- **Files**: S3 provides 99.999999999% durability
- **Code**: GitHub repository

---

## 🚨 **Troubleshooting**

### Common Issues

1. **CORS Errors**
   - Verify CORS_ORIGINS matches your frontend URL exactly
   - Check for trailing slashes

2. **Database Connection**
   - Use internal database URL for backend
   - Verify migrations have been run

3. **Email Not Sending**
   - Check SMTP credentials
   - Verify Gmail app password is correct

4. **File Upload Issues**
   - Verify AWS credentials
   - Check S3 bucket permissions

### Support Resources

- **Render Support**: [render.com/docs](https://render.com/docs)
- **Vercel Support**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

## 🎉 **Post-Deployment**

Your Vevurn POS system is now live! 

**Frontend**: `https://your-app.vercel.app`  
**Backend**: `https://your-backend.onrender.com`

### First Steps:
1. Create your business account
2. Set up your first cashier
3. Add your products
4. Start processing sales!

### Production Monitoring:
- Set up uptime monitoring
- Monitor error rates
- Track performance metrics
- Regular security updates
