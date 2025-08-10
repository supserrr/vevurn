# Deployment Documentation

This directory contains all deployment-related files and documentation for the Vevurn POS System.

## 📁 Directory Structure

### `/render/` - Render.com Configuration
- `render.yaml` - Main deployment configuration
- `render-*.yaml` - Various deployment options (backend-only, frontend-only, etc.)
- `render.json` - Render JSON configuration

### Root Deployment Files
- `DEPLOYMENT.md` - Render-specific deployment guide
- `DEPLOYMENT_COMPREHENSIVE.md` - Complete deployment documentation
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `DEPLOYMENT_STATUS.md` - Current deployment status
- `EMERGENCY_STATUS.md` - Emergency deployment procedures
- `MANUAL-RENDER-SETUP.md` - Manual setup instructions
- `RENDER-README.md` - Render platform guide
- `RENDER_DEPLOYMENT*.md` - Additional render deployment docs

## 🚀 Quick Deployment

1. **Standard Deployment**: Use `render/render.yaml`
2. **Backend Only**: Use `render/render-backend-only.yaml`
3. **Frontend Only**: Use `render/render-frontend-only.yaml`

## 📋 Deployment Checklist

Before deploying, check `DEPLOYMENT_CHECKLIST.md` for:
- Environment variables
- Database connections
- Service dependencies
- Security configurations

## 🆘 Emergency Procedures

For emergency deployments, see `EMERGENCY_STATUS.md` and use the emergency deployment scripts in `/scripts/`.

## 📖 Documentation

- Start with `DEPLOYMENT_COMPREHENSIVE.md` for complete overview
- Check `DEPLOYMENT.md` for Render-specific instructions
- Review `MANUAL-RENDER-SETUP.md` for manual setup steps
