# Scripts Directory

This directory contains build and deployment scripts for the Vevurn POS System.

## 📁 Available Scripts

### Build Scripts
- `build.sh` - Main build script for the entire project
- `build-backend.sh` - Backend-specific build script
- `build-frontend.sh` - Frontend-specific build script

### Deployment Scripts
- `render-build.sh` - Render.com build script
- `emergency-deploy.sh` - Emergency deployment script

## 🔧 Usage

### Build the entire project:
```bash
./scripts/build.sh
```

### Build backend only:
```bash
./scripts/build-backend.sh
```

### Build frontend only:
```bash
./scripts/build-frontend.sh
```

### Emergency deployment:
```bash
./scripts/emergency-deploy.sh
```

## ⚠️ Prerequisites

Make sure you have:
- Node.js and pnpm installed
- Environment variables configured
- Database connections available
- Appropriate permissions for deployment

## 🚨 Emergency Procedures

The `emergency-deploy.sh` script is for critical production fixes. Use with caution and follow the emergency deployment checklist in `/deployment/EMERGENCY_STATUS.md`.

## 📖 Documentation

For more detailed information:
- See `/deployment/` for deployment documentation
- Check `/docs/SCRIPTS_README.md` for additional script documentation
- Review individual script files for inline comments and usage instructions
