# Archived Scripts

This directory contains scripts that were previously part of the main codebase but are no longer actively used in the current development workflow. They have been moved here to keep the repository clean while preserving them for reference or potential future use.

## Directory Structure

```
archived-scripts/
├── test-files/              # Archived test and utility scripts
│   ├── generate-mtn-uuid.cjs
│   ├── generate-mtn-uuid.js  
│   ├── setup-mtn-credentials.js
│   ├── test-better-auth-complete.js
│   ├── test-better-auth-integration.js
│   ├── test-database-pool.js
│   ├── test-error-tracking.js
│   ├── test-mobile-money-complete.js
│   ├── test-mtn-rwanda-integration.cjs
│   ├── test-mtn-rwanda-integration.js
│   ├── test-mtn-simple.cjs
│   ├── test-routes.js
│   ├── test-typescript-integration.ts
│   └── test-user-management.js
├── utilities/               # Archived utility scripts  
│   ├── performance-test.sh
│   └── security-scan.sh
├── setup-critical-improvements.sh
└── verify-auth-organization.sh
```

## Why These Were Archived

### Test Files
- **Legacy test files**: These were standalone test files that are no longer used in the current testing workflow
- **MTN integration tests**: Old integration test files that may have been superseded by newer implementations
- **Duplicate files**: CJS versions of files that exist as ES modules

### Utility Scripts  
- **Performance test script**: Functionality moved to proper testing framework
- **Security scan script**: Likely replaced by automated CI/CD security scanning

### Setup Scripts
- **Critical improvements setup**: One-time setup script that was likely used during migration
- **Auth organization verification**: Legacy verification script

## Current Active Scripts

The following scripts remain in the main codebase and are actively used:

### Root Build Scripts
- `build-backend.sh` - Used by Render deployment for backend
- `build-frontend.sh` - Used by Render deployment for frontend  
- `build.sh` - Main build script with service detection

### Backend Scripts (`backend/scripts/`)
- `test-email.ts` - Email testing (referenced in package.json)
- `test-oauth.ts` - OAuth testing (referenced in package.json)
- `test-rate-limit.ts` - Rate limit testing (referenced in package.json)
- `generate-auth-secret.sh` - Auth secret generation (referenced in docs)
- `setup-dev.sh` - Development setup (referenced in docs)

### Backend Scripts (`backend/scripts/database/`)
- `backup.sh` - Database backup (referenced in docs)
- `restore.sh` - Database restore (referenced in docs)

### Backend Scripts (`backend/scripts/maintenance/`)
- `health-check.sh` - System health checking (referenced in docs)

### Backend Root
- `test-session-management.ts` - Session testing (referenced in package.json)

## Recovery

If you need to restore any of these scripts:

1. **Copy back to original location**:
   ```bash
   cp archived-scripts/test-files/[script-name] ./
   ```

2. **Update references**: Add any necessary references back to `package.json` or other configuration files

3. **Update documentation**: Update relevant documentation if the script provides functionality that should be documented

## Cleanup Date

These scripts were archived on: August 9, 2025
